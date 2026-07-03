---
version: alpha
name: MFM Innovation Team
description: Creative and forward-thinking interface for MFM Corporation's Innovation Team. The system builds on the corporate design foundation with enhanced creative elements, vibrant accent colors for ideation, and collaborative workspace layouts. Brand voltage comes from the corporate blue paired with innovation orange — suggesting creativity within the professional framework. Type voice maintains the corporate Inter system with added emphasis on creative typography.

extends: "../DESIGN.md"

colors:
  primary: "#0369A1"
  primary-active: "#0284C7"
  innovation-accent: "#EA580C"
  innovation-accent-active: "#DC2626"
  creative-canvas: "#FFF5F5"
  idea-surface: "#FEF2F2"
  collaboration-bg: "#F0F9FF"
  brainstorm-primary: "#1E40AF"
  brainstorm-secondary: "#7C3AED"

typography:
  creative-display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.25px
  idea-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0px
  collaboration-text:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: 0px

components:
  idea-cards:
    default:
      background: idea-surface
      border: "2px solid innovation-accent"
      borderRadius: lg
      padding: lg
      boxShadow: md
      hover:
        borderColor: innovation-accent-active
        transform: "translateY(-4px) scale(1.02)"
        boxShadow: lg
    featured:
      background: creative-canvas
      border: "3px solid innovation-accent"
      borderRadius: xl
      padding: xl
      boxShadow: lg
      hover:
        borderColor: innovation-accent-active
        transform: "translateY(-6px) scale(1.03)"
        boxShadow: xl
  brainstorm-board:
    background: collaboration-bg
    border: "1px solid hairline"
    borderRadius: lg
    padding: lg
    boxShadow: sm
  collaboration-tools:
    chat:
      background: surface-card
      border: "1px solid hairline"
      borderRadius: md
      padding: md
      boxShadow: sm
    whiteboard:
      background: surface-card
      border: "2px solid innovation-accent"
      borderRadius: lg
      padding: lg
      boxShadow: md
    voting:
      background: idea-surface
      border: "1px solid innovation-accent"
      borderRadius: md
      padding: sm
      boxShadow: sm

layout:
  innovation-workspace:
    grid:
      cols: 3
      gap: lg
      responsive:
        mobile:
          cols: 1
        tablet:
          cols: 2
        desktop:
          cols: 3
  brainstorm-area:
    padding: "2xl"
    background: collaboration-bg
    borderRadius: lg
  idea-gallery:
    display: grid
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
    gap: lg
    padding: lg

usage:
  innovationDashboard:
    description: "Creative workspace for innovation team with idea management and collaboration tools"
    components: ["idea cards", "brainstorm board", "collaboration tools", "innovation metrics"]
    layout: "flexible grid with creative emphasis"
  ideaManagement:
    description: "Interface for capturing, organizing, and developing innovative ideas"
    components: ["idea forms", "voting systems", "progress tracking", "team collaboration"]
    layout: "card-based with interactive elements"
