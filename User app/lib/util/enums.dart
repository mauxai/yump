enum EditorTool { lasso, shape, brush, crop, heal, color }

enum CropHandle {
  topLeft,
  top,
  topRight,
  right,
  bottomRight,
  bottom,
  bottomLeft,
  left,
  move,
}

enum BrushStyle { basic, glow, highlighter, eraser }

enum ShapeOption { circle, square, triangle, heart, star }

enum NotificationType {
  editCompleted('edit_completed');

  final String value;
  const NotificationType(this.value);

  static NotificationType? fromValue(String? value) {
    if (value == null) return null;
    for (final type in NotificationType.values) {
      if (type.value == value) return type;
    }
    return null;
  }
}