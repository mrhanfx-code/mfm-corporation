# MFM Design App

A simplified Adobe Illustrator-style design application with integrated AI capabilities for Windows desktop.

## Features

### Core Drawing Tools
- **Selection Tool** - Select and move objects
- **Rectangle Tool** - Draw rectangles and squares
- **Ellipse Tool** - Draw circles and ellipses
- **Line Tool** - Draw straight lines
- **Text Tool** - Add text to designs
- **Fill Tool** - Apply fill colors

### Canvas Controls
- Zoom in/out with mouse wheel or buttons
- Pan and navigate canvas
- Real-time preview while drawing
- Selection highlighting

### Layer System
- Basic layer management
- Show/hide layers
- Layer organization

### Properties Panel
- Fill color picker
- Stroke color picker
- Stroke width adjustment
- Opacity control

### File Operations
- New design creation
- Save/Load designs (JSON format)
- Export to SVG, PNG formats
- PDF export (planned)

### AI Features (Phase 3)
- Generate designs from text prompts
- Browse online design repositories
- Local AI processing for privacy

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone or download the application**
   ```bash
   cd mfm-design-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

4. **Development mode** (with DevTools)
   ```bash
   npm run dev
   ```

## Usage

### Basic Drawing
1. Select a tool from the toolbar
2. Click and drag on the canvas to create shapes
3. Use the Properties panel to adjust colors and stroke
4. Select objects with the Selection tool to move them

### Keyboard Shortcuts
- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+E` - Export file
- `Ctrl+G` - Generate AI design (Phase 3)
- `Ctrl+B` - Browse online designs (Phase 3)
- `Ctrl+Plus` - Zoom in
- `Ctrl+Minus` - Zoom out
- `Ctrl+0` - Reset zoom

### File Formats
- **Native**: JSON format for saving designs
- **Import**: Adobe Illustrator (.ai) files (Phase 2)
- **Export**: SVG, PNG, PDF formats

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Electron Windows app setup
- [x] Basic canvas with zoom/pan
- [x] Simple drawing tools
- [x] Basic layer system
- [x] File save/load functionality

### Phase 2: .ai File Support ✅
- [x] .ai file parser implementation
- [x] Vector import capabilities
- [x] Enhanced export options
- [x] PDF export functionality
- [x] Improved SVG export

### Phase 3: AI Integration ✅
- [x] Local AI model setup
- [x] Text-to-design generation
- [x] Online design browsing
- [x] AI-powered style suggestions
- [x] AI integration with drawing tools

### Phase 4: Professional Features ✅
- [x] Advanced typography system
- [x] Professional export options
- [x] Performance optimization
- [x] UI/UX refinements
- [x] Keyboard shortcuts and workflow improvements

## Technical Architecture

### Technology Stack
- **Framework**: Electron for cross-platform desktop support
- **Graphics**: HTML5 Canvas API for rendering
- **UI**: Vanilla JavaScript with modern ES6+ features
- **AI**: TensorFlow.js for local processing (Phase 3)

### Project Structure
```
mfm-design-app/
├── src/
│   ├── main.js          # Electron main process
│   ├── index.html       # Main UI
│   └── app.js           # Application logic
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## System Requirements

- **Operating System**: Windows 10 or higher
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB available space
- **Graphics**: Basic GPU acceleration recommended

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Ensure Node.js is properly installed
   - Check that all dependencies are installed
   - Run as administrator if permission issues occur

2. **Canvas not responding**
   - Restart the application
   - Check system resources
   - Update graphics drivers

3. **File operations failing**
   - Check file permissions
   - Ensure sufficient disk space
   - Verify file format compatibility

## Support

For technical support and feature requests, contact MFM Corporation development team.

## License

MIT License - See LICENSE file for details.

---

**MFM Corporation Design App** - Simplified professional design with AI assistance.
