import 'package:flutter/material.dart';
import '../../../util/enums.dart';

class DrawStroke {
  final List<Offset> points;
  final Color color;
  final double size;
  final BrushStyle style;

  DrawStroke({
    required this.points,
    required this.color,
    required this.size,
    required this.style,
  });
}
