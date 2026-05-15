---
version: alpha
name: MFM Corporation
description: Professional B2B command center interface for CEO Remy. The system anchors on a clean white canvas with professional navy accents, structured executive dashboard layouts, and corporate trust elements. Brand voltage comes from the navy/blue pairing — deliberately professional and authoritative where consumer brands use warm colors. Type voice runs a clean sans-serif system (Inter) for all typography with clear hierarchy. The signature MFM Corporation blue mark anchors the executive identity.

colors:
  primary: "#0369A1"
  primary-active: "#0284C7"
  primary-disabled: "#E2E8F0"
  ink: "#020617"
  body: "#1E293B"
  body-strong: "#0F172A"
  muted: "#64748B"
  muted-soft: "#94A3B8"
  hairline: "#E2E8F0"
  hairline-soft: "#F1F5F9"
  canvas: "#F8FAFC"
  surface-soft: "#F1F5F9"
  surface-card: "#FFFFFF"
  surface-neutral: "#F8FAFC"
  surface-dark: "#0F172A"
  surface-dark-elevated: "#1E293B"
  surface-dark-soft: "#334155"
  on-primary: "#FFFFFF"
  on-dark: "#F8FAFC"
  on-dark-soft: "#CBD5E1"
  accent-corporate: "#0F172A"
  accent-success: "#22C55E"
  accent-warning: "#F59E0B"
  accent-error: "#EF4444"
  accent-info: "#3B82F6"

typography:
  display-xl:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.5px
  display-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.25px
  display-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0px
  display-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0px
  headline-xl:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  headline-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  headline-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0px
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0px
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px

borderRadius:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

shadows:
  sm: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)"
  md: "0px 4px 6px -1px rgba(0, 0, 0, 0.1)"
  lg: "0px 10px 15px -3px rgba(0, 0, 0, 0.1)"
  xl: "0px 20px 25px -5px rgba(0, 0, 0, 0.1)"
  corporate: "0px 2px 8px 0px rgba(3, 105, 161, 0.15)"

components:
  buttons:
    primary:
      background: primary
      color: on-primary
      border: none
      borderRadius: md
      padding: "sm md"
      fontSize: body
      fontWeight: 500
      hover:
        background: primary-active
        transform: "translateY(-1px)"
        boxShadow: md
      active:
        background: primary-active
        transform: "translateY(0px)"
      disabled:
        background: primary-disabled
        color: muted
        cursor: not-allowed
    secondary:
      background: surface-card
      color: ink
      border: "1px solid hairline"
      borderRadius: md
      padding: "sm md"
      fontSize: body
      fontWeight: 500
      hover:
        background: surface-soft
        borderColor: primary
        transform: "translateY(-1px)"
        boxShadow: sm
      active:
        background: surface-neutral
        transform: "translateY(0px)"
    outline:
      background: transparent
      color: primary
      border: "1px solid primary"
      borderRadius: md
      padding: "sm md"
      fontSize: body
      fontWeight: 500
      hover:
        background: primary
        color: on-primary
        transform: "translateY(-1px)"
        boxShadow: sm
    destructive:
      background: accent-error
      color: "#FFFFFF"
      border: none
      borderRadius: md
      padding: "sm md"
      fontSize: body
      fontWeight: 500
      hover:
        background: "#DC2626"
        transform: "translateY(-1px)"
        boxShadow: md

  cards:
    default:
      background: surface-card
      border: "1px solid hairline"
      borderRadius: lg
      padding: lg
      boxShadow: sm
      hover:
        boxShadow: md
        transform: "translateY(-2px)"
        borderColor: primary
    elevated:
      background: surface-card
      border: "1px solid hairline"
      borderRadius: lg
      padding: lg
      boxShadow: lg
      hover:
        boxShadow: xl
        transform: "translateY(-4px)"
    compact:
      background: surface-card
      border: "1px solid hairline"
      borderRadius: md
      padding: md
      boxShadow: sm
      hover:
        boxShadow: md
        transform: "translateY(-1px)"
    executive:
      background: surface-card
      border: "1px solid hairline"
      borderRadius: lg
      padding: xl
      boxShadow: corporate
      hover:
        boxShadow: lg
        borderColor: primary
        transform: "translateY(-2px)"

  inputs:
    default:
      background: surface-card
      color: ink
      border: "1px solid hairline"
      borderRadius: md
      padding: "sm md"
      fontSize: body
      fontWeight: 400
      placeholder: muted
      focus:
        borderColor: primary
        boxShadow: "0 0 0 3px rgba(3, 105, 161, 0.1)"
        outline: none
      error:
        borderColor: accent-error
        boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.1)"
    search:
      background: surface-soft
      color: ink
      border: "1px solid hairline"
      borderRadius: xl
      padding: "sm md"
      fontSize: body
      fontWeight: 400
      placeholder: muted
      focus:
        borderColor: primary
        boxShadow: "0 0 0 3px rgba(3, 105, 161, 0.1)"
        outline: none

  navigation:
    header:
      background: surface-card
      border: "none"
      borderBottom: "1px solid hairline"
      padding: "md lg"
      boxShadow: sm
      position: sticky
      top: 0
      zIndex: 100
    sidebar:
      background: surface-card
      border: "none"
      borderRight: "1px solid hairline"
      padding: lg
      width: 280px
      boxShadow: sm
    footer:
      background: surface-dark
      color: on-dark
      border: "none"
      borderTop: "1px solid surface-dark-soft"
      padding: "lg xl"

layout:
  container:
    maxWidth: 1200px
    margin: "0 auto"
    padding: "0 lg"
  grid:
    cols: 12
    gap: lg
    responsive:
      mobile:
        cols: 1
        gap: md
      tablet:
        cols: 2
        gap: lg
      desktop:
        cols: 3
        gap: lg
      wide:
        cols: 4
        gap: xl
  sections:
    hero:
      padding: "4xl 0"
      background: canvas
      textAlign: center
    features:
      padding: "4xl 0"
      background: surface-card
    dashboard:
      padding: "2xl 0"
      background: canvas
    cta:
      padding: "4xl 0"
      background: primary
      color: on-primary

animations:
  duration:
    fast: 150ms
    normal: 200ms
    slow: 300ms
  easing:
    ease: "ease"
    easeIn: "ease-in"
    easeOut: "ease-out"
    easeInOut: "ease-in-out"
  transitions:
    default: "all var(--duration-normal) var(--easing-out)"
    colors: "color var(--duration-fast) var(--easing-out), background-color var(--duration-fast) var(--easing-out), border-color var(--duration-fast) var(--easing-out)"
    transform: "transform var(--duration-normal) var(--easing-out)"

accessibility:
  focusVisible:
    outline: "2px solid primary"
    outlineOffset: 2px
  reducedMotion:
    animationDuration: "0.01ms"
    transitionDuration: "0.01ms"
  highContrast:
    primary: "#0000FF"
    accent: "#FF0000"
    text: "#000000"
    background: "#FFFFFF"

breakpoints:
  mobile: 375px
  tablet: 768px
  desktop: 1024px
  wide: 1440px

usage:
  ceoDashboard:
    description: "Executive command center with real-time metrics and team status"
    components: ["executive cards", "kpi displays", "team status grid", "activity feed"]
    layout: "grid-based with sidebar navigation"
  teamInterface:
    description: "Team collaboration interface with task management"
    components: ["task cards", "progress indicators", "team member profiles", "communication tools"]
    layout: "flexible grid with responsive columns"
  authentication:
    description: "Secure CEO authentication interface"
    components: ["login form", "security indicators", "brand elements"]
    layout: "centered with minimal distractions"
