use std::collections::HashSet;
use std::ops::Range;
use wasm_bindgen::prelude::*;
use typst::comemo::Track;
use typst::{Library, LibraryExt, World};
use typst::diag::FileResult;
use typst::foundations::{Bytes, Datetime, Context, Scopes, StyleChain, Styles};
use typst::layout::{Size, Abs, Axes, Region, Regions, Frame, FrameItem, Point};
use typst::syntax::{FileId, Source, parse_math, Span, VirtualPath};
use typst::syntax::ast::AstNode;
use typst::text::{Font, FontBook, TextElem, FontWeight, FontFamily, FontList};
use typst::utils::LazyHash;
use typst::engine::{Engine, Route, Sink, Traced};
use typst::introspection::Introspector;
use typst_eval::{Eval, Vm};
use typst_layout::math::layout_equation_block;
use typst::math::{EquationElem, MathSize};
use typst::foundations::NativeElement;
use typst::visualize::{Paint, Color};
use once_cell::sync::Lazy;
use serde::{Serialize, Deserialize};
use typst::WorldExt;

#[derive(Debug, Copy, Clone)]
struct BoundingBox {
    x0: f64, x1: f64, y0: f64, y1: f64
}

impl BoundingBox {
    fn merge(&self, v: BoundingBox) -> BoundingBox {
        BoundingBox {
            x0: self.x0.min(v.x0),
            x1: self.x1.max(v.x1),
            y0: self.y0.min(v.y0),
            y1: self.y1.max(v.y1)
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Subexpression {
    text: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    source_start: Option<usize>,
    source_end: Option<usize>,
    glyph_lines: usize,
}

#[derive(Serialize, Deserialize)]
struct MathResult {
    svg: String,
    subexpressions: Vec<Subexpression>,
}

#[derive(Serialize, Deserialize)]
struct ErrorResult {
    error: String,
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

static FONTS: Lazy<(LazyHash<FontBook>, Vec<Font>)> = Lazy::new(|| {
    let fonts: Vec<_> = typst_assets::fonts()
        .flat_map(|data| Font::iter(Bytes::new(data)))
        .collect();
    let book = FontBook::from_fonts(&fonts);
    (LazyHash::new(book), fonts)
});


struct SimpleWorld {
    library: LazyHash<Library>,
    source: Source,
}

impl SimpleWorld {
    fn new(source: Source) -> Self {
        let library = Library::builder().build();
        Self {
            library: LazyHash::new(library),
            source,
        }
    }

    fn upcast(&self) -> &dyn World {
        self
    }
}

impl World for SimpleWorld {
    fn library(&self) -> &LazyHash<Library> {
        &self.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &FONTS.0
    }

    fn main(&self) -> FileId {
        self.source.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.source.id() {
            Ok(self.source.clone())
        } else {
            Err(typst::diag::FileError::NotFound(std::path::PathBuf::new()))
        }
    }

    fn file(&self, _id: FileId) -> FileResult<Bytes> {
        Err(typst::diag::FileError::NotFound(std::path::PathBuf::new()))
    }

    fn font(&self, index: usize) -> Option<Font> {
        FONTS.1.get(index).cloned()
    }

    fn today(&self, _offset: Option<i64>) -> Option<Datetime> {
        None
    }
}

/// Extract all subexpression spans from the AST
fn extract_ast_spans(ast: &typst::syntax::ast::Math, source_text: &str, world: &dyn World) -> Vec<(Span, String)> {
    let mut spans = Vec::new();

    // Add the root math node
    let root_span = ast.span();
    if let Some(range) = world.range(root_span) {
        if range.end <= source_text.len() {
            spans.push((root_span, source_text[range.start..range.end].to_string()));
        }
    }

    // Walk through all child expressions
    for expr in ast.exprs() {
        collect_expr_spans(expr, source_text, world, &mut spans);
    }

    // Deduplicate spans by source range
    let mut seen_ranges = HashSet::new();
    spans.retain(|(span, _)| {
        if let Some(range) = world.range(*span) {
            seen_ranges.insert((range.start, range.end))
        } else {
            false
        }
    });

    spans
}

fn collect_expr_spans(expr: typst::syntax::ast::Expr, source_text: &str, world: &dyn World, spans: &mut Vec<(Span, String)>) {
    use typst::syntax::ast::Expr;

    let span = expr.span();
    if let Some(range) = world.range(span) {
        if range.end <= source_text.len() {
            spans.push((span, source_text[range.start..range.end].to_string()));
        }
    }

    match expr {
        Expr::Math(math) => {
            // Recurse into nested math
            for child_expr in math.exprs() {
                collect_expr_spans(child_expr, source_text, world, spans);
            }
        }
        Expr::MathFrac(frac) => {
            // Add numerator and denominator
            collect_expr_spans(frac.num(), source_text, world, spans);
            collect_expr_spans(frac.denom(), source_text, world, spans);
        }
        Expr::MathAttach(attach) => {
            // Add base
            collect_expr_spans(attach.base(), source_text, world, spans);
            // Add bottom attachment (subscript) if present
            if let Some(bottom) = attach.bottom() {
                collect_expr_spans(bottom, source_text, world, spans);
            }
            // Add top attachment (superscript) if present
            if let Some(top) = attach.top() {
                collect_expr_spans(top, source_text, world, spans);
            }
        }
        Expr::MathPrimes(_primes) => {
            // MathPrimes is just primes themselves (e.g., a'''), no base
            // The span is already added above
        }
        Expr::MathRoot(root) => {
            // Add radicand
            collect_expr_spans(root.radicand(), source_text, world, spans);
            // Index is not an Expr, it's a u8, so we don't recurse there
        }
        Expr::MathDelimited(delim) => {
            // Recurse into body expressions
            for child_expr in delim.body().exprs() {
                collect_expr_spans(child_expr, source_text, world, spans);
            }
        }
        Expr::FuncCall(call) => {
            // Recurse into function arguments if they contain math
            collect_expr_spans(call.callee(), source_text, world, spans);
            for arg in call.args().items() {
                if let typst::syntax::ast::Arg::Pos(expr) = arg {
                    collect_expr_spans(expr, source_text, world, spans);
                }
            }
        }
        Expr::Parenthesized(paren) => {
            collect_expr_spans(paren.expr(), source_text, world, spans);
        }
        Expr::Array(array) => {
            // Recurse into array items
            for item in array.items() {
                match item {
                    typst::syntax::ast::ArrayItem::Pos(expr) => {
                        collect_expr_spans(expr, source_text, world, spans);
                    }
                    typst::syntax::ast::ArrayItem::Spread(spread) => {
                        collect_expr_spans(spread.expr(), source_text, world, spans);
                    }
                }
            }
        }
        Expr::Dict(dict) => {
            // Recurse into dict items
            for item in dict.items() {
                match item {
                    typst::syntax::ast::DictItem::Named(named) => {
                        collect_expr_spans(named.expr(), source_text, world, spans);
                    }
                    typst::syntax::ast::DictItem::Keyed(keyed) => {
                        collect_expr_spans(keyed.key(), source_text, world, spans);
                        collect_expr_spans(keyed.expr(), source_text, world, spans);
                    }
                    typst::syntax::ast::DictItem::Spread(spread) => {
                        collect_expr_spans(spread.expr(), source_text, world, spans);
                    }
                }
            }
        }
        Expr::ContentBlock(block) => {
            // Recurse into content block markup
            for expr in block.body().exprs() {
                collect_expr_spans(expr, source_text, world, spans);
            }
        }
        Expr::Binary(binary) => {
            collect_expr_spans(binary.lhs(), source_text, world, spans);
            collect_expr_spans(binary.rhs(), source_text, world, spans);
        }
        Expr::Unary(unary) => {
            collect_expr_spans(unary.expr(), source_text, world, spans);
        }
        // Terminal nodes - no recursion needed
        Expr::MathIdent(_ident) => {
            // Span already added above
        }
        Expr::Ident(_ident) => {
            // Span already added above
        }
        Expr::MathShorthand(_) | Expr::MathAlignPoint(_) |
        Expr::Text(_) | Expr::Str(_) | Expr::Int(_) | Expr::Float(_) |
        Expr::Bool(_) | Expr::None(_) | Expr::Auto(_) => {
            // These are leaf nodes, span already added above
        }
        // Other expression types that might appear
        _ => {
            // For any other expression types, we've at least added the span above
        }
    }
}

fn normalize_bbox(bbox: typst::layout::Rect, offset: Point) -> BoundingBox {
    // Text uses Y-up, frames use Y-down - flip Y coordinates
    let min = bbox.min;
    let max = bbox.max;

    // Add offset to convert to absolute coordinates
    let corner1 = offset + min;
    let corner2 = offset + max;

    // Normalize to ensure x0 < x1 and y0 < y1
    BoundingBox {
        x0: corner1.x.to_pt().min(corner2.x.to_pt()),
        x1: corner1.x.to_pt().max(corner2.x.to_pt()),
        y0: corner1.y.to_pt().min(corner2.y.to_pt()),
        y1: corner1.y.to_pt().max(corner2.y.to_pt()),
    }
}

fn get_frame_box_spans(frame: &Frame, world: &dyn World, offset: Point, res: &mut Vec<(Range<usize>, BoundingBox)>) {
    for (pos, item) in frame.items() {
        match item {
            FrameItem::Group(group) => {
                get_frame_box_spans(&group.frame, world, offset + *pos, res);
            }
            FrameItem::Text(text_item) => {
                let bounding_box = normalize_bbox(text_item.bbox(), offset + *pos); 
                let mut span_min = None;
                let mut span_max = None;
                for glyph in &text_item.glyphs {
                    let (glyph_span, _) = glyph.span;
                    if let Some(glyph_range) = world.range(glyph_span) {
                        if span_min.is_none() {span_min = Some(glyph_range.start)};
                        if span_max.is_none() {span_max = Some(glyph_range.end)};
                        if Some(glyph_range.start) < span_min {span_min = Some(glyph_range.start)};
                        if Some(glyph_range.end) > span_max {span_max = Some(glyph_range.end)};
                    }
                }

                let Some(s) = span_min else {continue};
                let Some(e) = span_max else {continue};
                res.push((s..e, bounding_box));
            }
            FrameItem::Shape(shape, shape_span) => {
                let bounding_box = normalize_bbox(shape.geometry.bbox(), offset + *pos); 
                let Some(shape_range) = world.range(*shape_span) else {continue};
                res.push((shape_range, bounding_box));
            },
            _ => {}
        }
    }
}

/// Extract subexpressions from AST with bounding boxes from frame
fn extract_subexpressions(
    ast: &typst::syntax::ast::Math,
    source_text: &str,
    frame: &Frame,
    world: &dyn World,
    offset: Point,
) -> Vec<Subexpression> {
    // Extract all spans from the AST
    let ast_spans = extract_ast_spans(ast, source_text, world);
    let mut box_spans = Vec::new();
    get_frame_box_spans(frame, world, Point::zero(), &mut box_spans);
    
    
    let mut results = Vec::new();

    // For each span, calculate its bounding box from the frame
    for (span, source) in ast_spans {
        let mut bounding_box = None;
        let mut glyph_lines = 0;
        let Some(span) = world.range(span) else {continue};
        for (sub_span, sub_bounding_box) in &box_spans {
            if !(sub_span.start >= span.start && sub_span.end <= span.end) {continue};
            if bounding_box.is_none() {bounding_box = Some(*sub_bounding_box)};
            bounding_box = bounding_box.map(|v| v.merge(*sub_bounding_box));
            glyph_lines += 1;
        }
        let Some(bbox_resolved) = bounding_box else {continue};
        results.push(Subexpression {
            text: source,
            x: bbox_resolved.x0,
            y: bbox_resolved.y0,
            width: bbox_resolved.x1 - bbox_resolved.x0,
            height: bbox_resolved.y1 - bbox_resolved.y0,
            source_start: Some(span.start),
            source_end: Some(span.end),
            glyph_lines,
        });
    }

    results
}

/// Compile pure math expression and return both SVG and subexpression data as JSON
#[wasm_bindgen]
pub fn compile_math_with_subexpressions(input: &str) -> String {
    // Create FileId first
    let file_id = FileId::new(None, VirtualPath::new("math.typ"));

    // Parse as pure math
    let mut root = parse_math(input);

    // Numberize the math tree to link spans to FileId
    if let Err(_) = root.numberize(file_id, Span::FULL) {
        return serde_json::to_string(&ErrorResult {
            error: "Failed to numberize spans".to_string(),
        })
        .unwrap_or_else(|_| r#"{"error":"JSON serialization failed"}"#.to_string());
    }

    // Check for parse errors
    let errors = root.errors();
    if !errors.is_empty() {
        let error_msg = errors
            .iter()
            .map(|e| format!("{}", e.message))
            .collect::<Vec<_>>()
            .join("\n");
        return serde_json::to_string(&ErrorResult {
            error: format!("Parse error: {}", error_msg),
        })
        .unwrap_or_else(|_| r#"{"error":"JSON serialization failed"}"#.to_string());
    }

    let math_ast1 = root.clone();
    let math_ast = match math_ast1.cast::<typst::syntax::ast::Math>() {
        Some(math) => math,
        None => {
            return serde_json::to_string(&ErrorResult {
                error: "Failed to cast to Math".to_string(),
            })
            .unwrap_or_else(|_| r#"{"error":"JSON serialization failed"}"#.to_string());
        }
    };

    // Create a Source with the numberized math tree (not markup tree)
    // This ensures source.range(span) can find spans in the math tree
    let source = Source::from_root(file_id, input.to_string(), root);

    let world = SimpleWorld::new(source);

    // Setup engine and VM for evaluation
    let introspector = Introspector::default();
    let traced = Traced::default();
    let mut sink = Sink::new();
    let engine = Engine {
        routines: &typst::ROUTINES,
        world: world.upcast().track(),
        introspector: introspector.track(),
        traced: traced.track(),
        sink: (&mut sink).track_mut(),
        route: Route::default(),
    };

    // Evaluate the parsed math AST
    let context = Context::none();
    let scopes = Scopes::new(Some(world.library()));
    // Use the math AST's span, not a detached one, so child elements inherit proper spans
    let mut vm = Vm::new(engine, context.track(), scopes, math_ast.span());

    let math_content = match math_ast.eval(&mut vm) {
        Ok(content) => content,
        Err(errors) => {
            let error_msg = errors
                .iter()
                .map(|e| format!("{}", e.message))
                .collect::<Vec<_>>()
                .join("\n");
            return serde_json::to_string(&ErrorResult {
                error: format!("Eval error: {}", error_msg),
            })
            .unwrap_or_else(|_| r#"{"error":"JSON serialization failed"}"#.to_string());
        }
    };

    // Wrap in EquationElem (block mode) - use the math AST's span
    let equation = EquationElem::new(math_content)
        .with_block(true)
        .pack();

    let equation_elem = match equation.to_packed::<EquationElem>() {
        Some(elem) => elem,
        None => {
            return serde_json::to_string(&ErrorResult {
                error: "Failed to pack equation".to_string(),
            })
            .unwrap_or_else(|_| r#"{"error":"JSON serialization failed"}"#.to_string());
        }
    };

    // Layout the equation to get frame
    let mut custom_styles = Styles::new();
    custom_styles.set(EquationElem::size, MathSize::Display);
    custom_styles.set(TextElem::weight, FontWeight::from_number(450));
    custom_styles.set(
        TextElem::font,
        FontList(vec![FontFamily::new("New Computer Modern Math")]),
    );
    custom_styles.set(TextElem::fill, Paint::Solid(Color::WHITE));
    let default_styles = StyleChain::default();
    let styles = default_styles.chain(&custom_styles);

    let region = Region::new(Size::new(Abs::inf(), Abs::inf()), Axes::splat(true));
    let regions: Regions = region.into();
    let locator = typst::introspection::Locator::root();

    let fragment = match layout_equation_block(&equation_elem, &mut vm.engine, locator, styles, regions) {
        Ok(fragment) => fragment,
        Err(errors) => {
            let error_msg = errors
                .iter()
                .map(|e| format!("{}", e.message))
                .collect::<Vec<_>>()
                .join("\n");
            return serde_json::to_string(&ErrorResult {
                error: format!("Layout error: {}", error_msg),
            })
            .unwrap_or_else(|_| r#"{"error":"JSON serialization failed"}"#.to_string());
        }
    };

    // Combine all frames into a single frame
    let frame = fragment.into_frame();


    // Extract subexpressions from AST with bounding boxes from frame
    let subexpressions = extract_subexpressions(&math_ast, input, &frame, world.upcast(), Point::zero());

    // Convert frame to SVG
    let svg = typst_svg::svg_frame(&frame);

    // Build JSON response using serde
    serde_json::to_string(&MathResult {
        svg,
        subexpressions,
    })
    .unwrap_or_else(|_| r#"{"error":"JSON serialization failed"}"#.to_string())
}
