# Taste Skill Configuration for MFM Corporation

**Project**: MFM Corporation
**Phase**: Phase 1 - Agent Upgrades
**Last Updated**: 2026-05-30
**Owner**: Sage (Backend Engineer)

---

## Taste Skill Dials Configuration

**Purpose**: Configure taste-skill dials for premium frontend design with anti-slop UI patterns

### Dial Settings

```yaml
DESIGN_VARIANCE: 6
MOTION_INTENSITY: 5
VISUAL_DENSITY: 7
```

---

## Dial Explanations

### DESIGN_VARIANCE: 6

**Range**: 1-10
**Current Setting**: 6 (Above Average)
**Purpose**: Controls design variety and creativity

**Impact**:
- Higher values = more diverse design patterns
- 6 = Balanced creativity with consistency
- Avoids generic AI aesthetics
- Enables unique visual identity

**Rationale for MFM**:
- Corporate dashboard needs professional variety
- 6 provides enough creativity without chaos
- Maintains brand consistency across sections

### MOTION_INTENSITY: 5

**Range**: 1-10
**Current Setting**: 5 (Medium)
**Purpose**: Controls animation and motion design

**Impact**:
- Higher values = more animations, transitions
- 5 = Balanced motion for professional use
- Subtle micro-interactions
- Smooth state transitions

**Rationale for MFM**:
- Dashboard needs responsive feel without distraction
- 5 provides professional motion
- Enhances UX without overwhelming users
- Suitable for 24/7 operation monitoring

### VISUAL_DENSITY: 7

**Range**: 1-10
**Current Setting**: 7 (High)
**Purpose**: Controls information density and layout complexity

**Impact**:
- Higher values = more information per screen
- 7 = Dense but readable layouts
- Efficient use of screen space
- Comprehensive data visualization

**Rationale for MFM**:
- 66 agents require dense monitoring
- 7 enables comprehensive agent status display
- Professional dashboard needs high information density
- Optimized for power users (CEO Remy, C-level executives)

---

## Anti-Slop Standards

### Design Principles

**1. No Generic Templates**
- Avoid Bootstrap/Tailwind default styles
- Custom color palettes
- Unique typography combinations
- Branded visual identity

**2. Premium Typography**
- Editorial-style type hierarchy
- Wide line heights for readability
- No 6-line text wraps
- Strong typographic contrast

**3. Strategic Spacing**
- Massive section spacing
- Gapless bento grids
- Consistent rhythm
- Visual breathing room

**4. Authentic Motion**
- Hardware-accelerated animations
- GSAP ScrollTriggers for scroll effects
- Pinning, stacking, scrubbing
- No generic CSS transitions

**5. Real Design Systems**
- Detect existing design systems
- Respect component libraries
- Maintain consistency
- Use shadcn/ui when applicable

---

## Dashboard Audit Requirements

### Current Dashboard: mfm-corp.cc.cd

**Audit Checklist**:
- [ ] Generic template usage
- [ ] Typography hierarchy issues
- [ ] Spacing inconsistencies
- [ ] Animation quality
- [ ] Color palette uniqueness
- [ ] Component reuse patterns
- [ ] Mobile responsiveness
- [ ] Performance optimization

**Redesign Goals**:
- Apply DESIGN_VARIANCE=6 for unique identity
- Apply MOTION_INTENSITY=5 for professional motion
- Apply VISUAL_DENSITY=7 for comprehensive monitoring
- Eliminate generic AI aesthetics
- Implement premium UI patterns

---

## Implementation Guidelines

### Component-Level Standards

**1. Cards**
- Subtle shadows (not heavy)
- Clean borders (not default)
- Custom hover states
- Consistent corner radius

**2. Typography**
- Editorial font stack
- H1-H6 hierarchy with clear contrast
- Line height 1.6-1.8
- Letter spacing optimized

**3. Colors**
- Custom palette (not default Tailwind)
- High contrast for accessibility
- Consistent semantic colors
- Dark mode support

**4. Spacing**
- 8px base unit
- Section spacing 64-96px
- Component spacing 24-32px
- Consistent padding

**5. Motion**
- GSAP for complex animations
- CSS transitions for simple states
- 300-500ms duration
- Ease-in-out easing

---

## References

- Taste Skill Documentation: Available via npx skills
- Dashboard URL: https://mfm-corp.cc.cd
- Design System: TBD (to be established)
- Brand Guidelines: TBD (to be established)
