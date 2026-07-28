import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';

class LassoPainter extends CustomPainter {
  const LassoPainter({required this.points, required this.imageRect, this.closed = false});

  final List<Offset> points;
  final Rect imageRect;
  final bool closed;

  static const _gradient = LinearGradient(
    colors: [AppColors.gradientStart, AppColors.gradientMid, AppColors.gradientEnd],
  );

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;

    final rect = imageRect;

    Offset toCanvas(Offset p) => Offset(imageRect.left + p.dx * imageRect.width, imageRect.top + p.dy * imageRect.height);

    final path = Path()..moveTo(toCanvas(points[0]).dx, toCanvas(points[0]).dy);
    for (int i = 1; i < points.length; i++) {
      final pt = toCanvas(points[i]);
      path.lineTo(pt.dx, pt.dy);
    }
    if (closed) path.close();

    if (closed) {
      final fillPaint = Paint()
        ..shader = LinearGradient(colors: [
          AppColors.gradientStart.withValues(alpha: 0.22),
          AppColors.gradientEnd.withValues(alpha: 0.22),
        ]).createShader(rect)
        ..style = PaintingStyle.fill;
      canvas.drawPath(path, fillPaint);
    }

    final dashedPath = _buildDashedPath(path);

    // Soft glow behind the dashed border
    final glowPaint = Paint()
      ..color = AppColors.gradientMid.withValues(alpha: 0.45)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7.0
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5);
    canvas.drawPath(dashedPath, glowPaint);

    // Gradient-colored dashed border
    final strokePaint = Paint()
      ..shader = _gradient.createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(dashedPath, strokePaint);
  }

  Path _buildDashedPath(Path source) {
    final metrics = source.computeMetrics();
    final dash = Path();
    for (final metric in metrics) {
      double dist = 0;
      while (dist < metric.length) {
        final on = (dist + 6).clamp(0, metric.length).toDouble();
        dash.addPath(metric.extractPath(dist, on), Offset.zero);
        dist += 12;
      }
    }
    return dash;
  }

  @override
  bool shouldRepaint(LassoPainter old) =>
      old.points != points || old.closed != closed || old.imageRect != imageRect;
}
