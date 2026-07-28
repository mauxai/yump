import 'package:flutter/material.dart';
import '../models/draw_stroke.dart';
import '../../../util/enums.dart';

class DrawPainter extends CustomPainter {
  final List<DrawStroke> strokes;
  final DrawStroke? currentStroke;

  const DrawPainter({required this.strokes, this.currentStroke});

  @override
  void paint(Canvas canvas, Size size) {
    canvas.saveLayer(Offset.zero & size, Paint());
    final all = [...strokes, if (currentStroke != null) currentStroke!];
    for (final stroke in all) {
      if (stroke.points.length < 2) continue;
      _paintStroke(canvas, stroke);
    }
    canvas.restore();
  }

  void _paintStroke(Canvas canvas, DrawStroke stroke) {
    final path = _buildPath(stroke.points);
    switch (stroke.style) {
      case BrushStyle.basic:
        canvas.drawPath(
          path,
          Paint()
            ..color = stroke.color
            ..strokeWidth = stroke.size
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round
            ..style = PaintingStyle.stroke,
        );

      case BrushStyle.glow:
        // outer halo
        canvas.drawPath(
          path,
          Paint()
            ..color = stroke.color.withValues(alpha: 0.2)
            ..strokeWidth = stroke.size * 5
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round
            ..style = PaintingStyle.stroke
            ..maskFilter =
                MaskFilter.blur(BlurStyle.normal, stroke.size * 2.0),
        );
        // mid glow
        canvas.drawPath(
          path,
          Paint()
            ..color = stroke.color.withValues(alpha: 0.5)
            ..strokeWidth = stroke.size * 2
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round
            ..style = PaintingStyle.stroke
            ..maskFilter =
                MaskFilter.blur(BlurStyle.normal, stroke.size * 0.6),
        );
        // bright core
        canvas.drawPath(
          path,
          Paint()
            ..color = stroke.color
            ..strokeWidth = stroke.size * 0.5
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round
            ..style = PaintingStyle.stroke,
        );

      case BrushStyle.highlighter:
        canvas.drawPath(
          path,
          Paint()
            ..color = stroke.color.withValues(alpha: 0.38)
            ..strokeWidth = stroke.size * 3.5
            ..strokeCap = StrokeCap.square
            ..strokeJoin = StrokeJoin.bevel
            ..style = PaintingStyle.stroke,
        );

      case BrushStyle.eraser:
        canvas.drawPath(
          path,
          Paint()
            ..color = Colors.transparent
            ..strokeWidth = stroke.size * 2
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round
            ..style = PaintingStyle.stroke
            ..blendMode = BlendMode.clear,
        );
    }
  }

  Path _buildPath(List<Offset> points) {
    final path = Path()..moveTo(points[0].dx, points[0].dy);
    if (points.length == 2) {
      path.lineTo(points[1].dx, points[1].dy);
      return path;
    }
    for (int i = 1; i < points.length - 1; i++) {
      final mid = Offset(
        (points[i].dx + points[i + 1].dx) / 2,
        (points[i].dy + points[i + 1].dy) / 2,
      );
      path.quadraticBezierTo(points[i].dx, points[i].dy, mid.dx, mid.dy);
    }
    path.lineTo(points.last.dx, points.last.dy);
    return path;
  }

  @override
  bool shouldRepaint(DrawPainter old) =>
      old.strokes != strokes || old.currentStroke != currentStroke;
}
