import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';

class EditorScanOverlay extends StatefulWidget {
  const EditorScanOverlay({super.key});

  @override
  State<EditorScanOverlay> createState() => _EditorScanOverlayState();
}

class _EditorScanOverlayState extends State<EditorScanOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2200),
  )..repeat(reverse: true);

  late final Animation<double> _scan = Tween<double>(begin: 0.0, end: 1.0)
      .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(color: Colors.black.withValues(alpha: 0.58)),

        AnimatedBuilder(
          animation: _scan,
          builder: (_, __) => CustomPaint(
            painter: _ScanLinePainter(progress: _scan.value),
          ),
        ),
      ],
    );
  }
}

class _ScanLinePainter extends CustomPainter {
  final double progress;

  const _ScanLinePainter({required this.progress});

  static const _gradientColors = [AppColors.gradientStart, AppColors.gradientEnd];

  @override
  void paint(Canvas canvas, Size size) {
    final y = progress * size.height;
    final lineRect = Rect.fromLTWH(0, y - 1, size.width, 2);

    // Radar-style sweep trail fading into the line from above.
    final trailTop = (y - 120.0).clamp(0.0, size.height);
    if (y > 0) {
      final trailRect = Rect.fromLTWH(0, trailTop, size.width, y - trailTop);
      canvas.drawRect(
        trailRect,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              AppColors.gradientMid.withValues(alpha: 0.1),
            ],
          ).createShader(trailRect),
      );
    }

    // Wide soft outer glow.
    canvas.drawLine(
      Offset(0, y), Offset(size.width, y),
      Paint()
        ..shader = LinearGradient(colors: [
          AppColors.gradientStart.withValues(alpha: 0.22),
          AppColors.gradientEnd.withValues(alpha: 0.22),
        ]).createShader(lineRect)
        ..strokeWidth = 20
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12),
    );

    // Medium inner glow.
    canvas.drawLine(
      Offset(0, y), Offset(size.width, y),
      Paint()
        ..shader = LinearGradient(colors: [
          AppColors.gradientStart.withValues(alpha: 0.5),
          AppColors.gradientEnd.withValues(alpha: 0.5),
        ]).createShader(lineRect)
        ..strokeWidth = 6
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
    );

    // Gradient accent line.
    canvas.drawLine(
      Offset(0, y), Offset(size.width, y),
      Paint()
        ..shader = const LinearGradient(colors: _gradientColors).createShader(lineRect)
        ..strokeWidth = 1.8,
    );

    // Bright white core.
    canvas.drawLine(
      Offset(0, y), Offset(size.width, y),
      Paint()
        ..color = Colors.white.withValues(alpha: 0.88)
        ..strokeWidth = 0.7,
    );
  }

  @override
  bool shouldRepaint(_ScanLinePainter old) => progress != old.progress;
}
