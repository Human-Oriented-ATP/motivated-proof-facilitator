#!/usr/bin/env node

/**
 * Generate SVG files for logical connectives using Typst WASM
 * 
 * This script compiles mathematical symbols using the same WASM module
 * that renders math expressions in the application, ensuring consistent
 * styling and appearance.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Import the WASM module
const wasmModule = await import('../pkg/typst_wasm.js')

// Initialize WASM with the .wasm file directly for Node.js
const wasmPath = join(__dirname, '../pkg/typst_wasm_bg.wasm')
const wasmBuffer = readFileSync(wasmPath)
await wasmModule.default(wasmBuffer)
wasmModule.init_panic_hook?.()

const symbols = {
    'conjunction': 'and',
    'disjunction': 'or',
    'negation': 'not',
    'implication': '=>',
    'equivalence': '<=>',
    'universal': 'forall',
    'existential': 'exists'
}

// Output directory for generated SVG files
const outputDir = join(__dirname, '../src/assets/logical-symbols')

// Create output directory if it doesn't exist
try {
    mkdirSync(outputDir, { recursive: true })
} catch (e) {
    // Directory already exists
}

console.log('Generating logical symbol SVGs using Typst WASM...\n')

for (const [name, symbol] of Object.entries(symbols)) {
    try {
        // Compile the symbol to get SVG (no dollar signs needed)
        const result = wasmModule.compile_math_with_subexpressions(symbol)
        const parsed = JSON.parse(result)
        
        if (parsed.error) {
            console.error(`❌ Error generating ${name}: ${parsed.error}`)
            continue
        }
        
        let svg = parsed.svg
        
        // Process the SVG to make it suitable for inline use
        // Remove XML declaration and DOCTYPE if present
        svg = svg.replace(/<\?xml[^?]*\?>/g, '')
        svg = svg.replace(/<!DOCTYPE[^>]*>/g, '')
        
        // Change white fills to black for visibility
        svg = svg.replace(/fill="#ffffff"/g, 'fill="#000000"')
        
        // Add preserveAspectRatio for better scaling
        svg = svg.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')
        
        // Write to file
        const outputPath = join(outputDir, `${name}.svg`)
        writeFileSync(outputPath, svg.trim())
        
        console.log(`✓ Generated ${name}.svg`)
    } catch (error) {
        console.error(`❌ Error generating ${name}:`, error.message)
    }
}

console.log('\n✨ Symbol generation complete!')
console.log(`📁 Files saved to: ${outputDir}`)
