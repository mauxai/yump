import 'package:flutter/material.dart';

class CropPainter extends CustomPainter {
  const CropPainter({required this.cropRect, this.showGrid = false});

  final Rect cropRect;
  final bool showGrid;

  static const _handleLen = 22.0;
  static const _handleThick = 3.5;
  static const _edgeRadius = 5.0;

  @override
  void paint(Canvas canvas, Size size) {
    _drawDimOverlay(canvas, size);
    _drawBorder(canvas);
    if (showGrid) _drawGrid(canvas);
    _drawCornerHandles(canvas);
    _drawEdgeHandles(canvas);
  }

  void _drawDimOverlay(Canvas canvas, Size size) {
    final dim = Paint()..color = Colors.black.withValues(alpha: 0.55);
    canvas.drawRect(Rect.fromLTRB(0, 0, size.width, cropRect.top), dim);
    canvas.drawRect(
        Rect.fromLTRB(0, cropRect.bottom, size.width, size.height), dim);
    canvas.drawRect(
        Rect.fromLTRB(0, cropRect.top, cropRect.left, cropRect.bottom), dim);
    canvas.drawRect(
        Rect.fromLTRB(cropRect.right, cropRect.top, size.width, cropRect.bottom),
        dim);
  }

  void _drawBorder(Canvas canvas) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRect(cropRect, paint);
  }

  void _drawGrid(Canvas canvas) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    final tw = cropRect.width / 3;
    final th = cropRect.height / 3;
    for (int i = 1; i < 3; i++) {
      canvas.drawLine(
        Offset(cropRect.left + tw * i, cropRect.top),
        Offset(cropRect.left + tw * i, cropRect.bottom),
        paint,
      );
      canvas.drawLine(
        Offset(cropRect.left, cropRect.top + th * i),
        Offset(cropRect.right, cropRect.top + th * i),
        paint,
      );
    }
  }

  void _drawCornerHandles(Canvas canvas) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = _handleThick
      ..strokeCap = StrokeCap.round;

    _drawCorner(canvas, paint, cropRect.topLeft, 1, 1);
    _drawCorner(canvas, paint, cropRect.topRight, -1, 1);
    _drawCorner(canvas, paint, cropRect.bottomLeft, 1, -1);
    _drawCorner(canvas, paint, cropRect.bottomRight, -1, -1);
  }

  void _drawCorner(
      Canvas canvas, Paint paint, Offset pt, double sx, double sy) {
    canvas.drawLine(pt, pt + Offset(_handleLen * sx, 0), paint);
    canvas.drawLine(pt, pt + Offset(0, _handleLen * sy), paint);
  }

  void _drawEdgeHandles(Canvas canvas) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    final cx = cropRect.center.dx;
    final cy = cropRect.center.dy;
    for (final pt in [
      Offset(cx, cropRect.top),
      Offset(cx, cropRect.bottom),
      Offset(cropRect.left, cy),
      Offset(cropRect.right, cy),
    ]) {
      canvas.drawCircle(pt, _edgeRadius, paint);
    }
  }

  @override
  bool shouldRepaint(CropPainter old) =>
      old.cropRect != cropRect || old.showGrid != showGrid;
}
