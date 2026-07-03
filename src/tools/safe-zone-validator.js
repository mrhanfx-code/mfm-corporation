// Safe-Zone Validator — 9:16 layout validation for mobile video content

/**
 * Validates that visual content fits within 9:16 safe zone for mobile platforms
 * @param {object} layoutData - Layout dimensions and element positions
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Validation result with issues and recommendations
 */
export async function validateSafeZone(layoutData, env) {
  const {
    width = 1080,
    height = 1920,
    elements = []
  } = layoutData;

  // 9:16 aspect ratio validation
  const aspectRatio = width / height;
  const targetAspectRatio = 9 / 16;
  const aspectRatioTolerance = 0.05;
  
  const issues = [];
  const warnings = [];

  // Check aspect ratio
  if (Math.abs(aspectRatio - targetAspectRatio) > aspectRatioTolerance) {
    issues.push({
      type: 'aspect_ratio',
      severity: 'critical',
      message: `Aspect ratio ${aspectRatio.toFixed(2)} does not match 9:16 (${targetAspectRatio.toFixed(2)})`,
      recommendation: 'Resize to 1080x1920 or maintain 9:16 ratio'
    });
  }

  // Safe zone boundaries (10% margin from edges)
  const safeZone = {
    left: width * 0.10,
    right: width * 0.90,
    top: height * 0.10,
    bottom: height * 0.90
  };

  // Validate each element
  elements.forEach((element, index) => {
    const { x, y, w, h, type } = element;
    
    // Check if element is outside safe zone
    if (x < safeZone.left) {
      issues.push({
        type: 'safe_zone_violation',
        severity: 'critical',
        element: index,
        elementType: type,
        message: `Element ${index} (${type}) extends beyond left safe zone`,
        recommendation: `Move element to x >= ${Math.round(safeZone.left)}px`
      });
    }
    
    if (x + w > safeZone.right) {
      issues.push({
        type: 'safe_zone_violation',
        severity: 'critical',
        element: index,
        elementType: type,
        message: `Element ${index} (${type}) extends beyond right safe zone`,
        recommendation: `Move element to x + w <= ${Math.round(safeZone.right)}px`
      });
    }
    
    if (y < safeZone.top) {
      issues.push({
        type: 'safe_zone_violation',
        severity: 'critical',
        element: index,
        elementType: type,
        message: `Element ${index} (${type}) extends beyond top safe zone`,
        recommendation: `Move element to y >= ${Math.round(safeZone.top)}px`
      });
    }
    
    if (y + h > safeZone.bottom) {
      issues.push({
        type: 'safe_zone_violation',
        severity: 'critical',
        element: index,
        elementType: type,
        message: `Element ${index} (${type}) extends beyond bottom safe zone`,
        recommendation: `Move element to y + h <= ${Math.round(safeZone.bottom)}px`
      });
    }

    // Check for element overlap (warning)
    elements.forEach((other, otherIndex) => {
      if (index !== otherIndex) {
        if (isOverlapping(element, other)) {
          warnings.push({
            type: 'element_overlap',
            severity: 'warning',
            element: index,
            otherElement: otherIndex,
            message: `Element ${index} overlaps with element ${otherIndex}`,
            recommendation: 'Adjust positions to avoid overlap'
          });
        }
      }
    });

    // Check text readability (warning)
    if (type === 'text') {
      if (w < width * 0.8) {
        warnings.push({
          type: 'text_width',
          severity: 'warning',
          element: index,
          message: `Text element ${index} may be too narrow for readability`,
          recommendation: 'Increase text width to at least 80% of canvas width'
        });
      }
    }
  });

  // Check for critical UI elements (bottom 15% for CTAs)
  const ctaZone = {
    top: height * 0.85,
    bottom: height
  };

  const hasCTA = elements.some(e => 
    e.type === 'button' || e.type === 'cta' || (e.type === 'text' && e.isCTA)
  );

  if (!hasCTA) {
    warnings.push({
      type: 'missing_cta',
      severity: 'warning',
      message: 'No CTA element detected in layout',
      recommendation: 'Add a call-to-action button in the bottom 15% of the layout'
    });
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = warnings.length;

  return {
    valid: criticalCount === 0,
    aspectRatio: aspectRatio.toFixed(2),
    safeZone: safeZone,
    issues,
    warnings,
    summary: {
      critical: criticalCount,
      warnings: warningCount,
      total: criticalCount + warningCount
    },
    recommendation: getOverallRecommendation(criticalCount, warningCount)
  };
}

function isOverlapping(elem1, elem2) {
  return !(elem1.x + elem1.w < elem2.x ||
           elem2.x + elem2.w < elem1.x ||
           elem1.y + elem1.h < elem2.y ||
           elem2.y + elem2.h < elem1.y);
}

function getOverallRecommendation(critical, warnings) {
  if (critical > 0) {
    return 'CRITICAL: Fix safe zone violations before publishing. Content may be cropped on mobile devices.';
  } else if (warnings > 0) {
    return 'WARNING: Address warnings for optimal user experience, but content is safe to publish.';
  } else {
    return 'VALID: Layout conforms to 9:16 safe zone guidelines. Safe to publish.';
  }
}

/**
 * Quick validation for simple use cases (dimensions only)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {object} - Quick validation result
 */
export function quickValidateAspectRatio(width, height) {
  const aspectRatio = width / height;
  const targetAspectRatio = 9 / 16;
  const tolerance = 0.05;
  
  const isValid = Math.abs(aspectRatio - targetAspectRatio) <= tolerance;
  
  return {
    isValid,
    aspectRatio: aspectRatio.toFixed(2),
    targetRatio: targetAspectRatio.toFixed(2),
    deviation: Math.abs(aspectRatio - targetAspectRatio).toFixed(3),
    recommendation: isValid 
      ? 'Valid 9:16 aspect ratio' 
      : `Resize to maintain 9:16 ratio (current: ${width}x${height})`
  };
}
