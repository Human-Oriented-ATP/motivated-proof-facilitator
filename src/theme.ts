import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#1d4ed8', light: '#3b82f6', dark: '#1e40af' },
    secondary: { main: '#16a34a', light: '#4ade80', dark: '#15803d' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    allVariants: { letterSpacing: 0 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, lineHeight: 1.4 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { background: '#0f172a', fontSize: '0.72rem', borderRadius: '6px', fontWeight: 500 },
        arrow: { color: '#0f172a' },
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true },
      styleOverrides: { root: { '&:before': { display: 'none' } } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 14 } },
    },
  },
})
