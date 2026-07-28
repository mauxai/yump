import 'dart:math';

import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../util/dimensions.dart';
import '../../util/styles.dart';

class CustomGradientButton extends StatefulWidget {
  final String text;
  final VoidCallback onTap;
  final double height;
  final double borderRadius;
  final bool isLoading;

  const CustomGradientButton({
    super.key,
    required this.text,
    required this.onTap,
    this.height = 54,
    this.borderRadius = Dimensions.radiusLarge - 1,
    this.isLoading = false,
  });

  @override
  State<CustomGradientButton> createState() => _CustomGradientButtonState();
}

class _CustomGradientButtonState extends State<CustomGradientButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.isLoading ? null : widget.onTap,
      child: Container(
        height: widget.height,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(widget.borderRadius),
        ),
        child: Center(
          child: widget.isLoading
              ? Row(mainAxisSize: MainAxisSize.min, children: [
                  BounceDot(controller: _controller, delay: 0.0),
                  const SizedBox(width: 7),
                  BounceDot(controller: _controller, delay: 0.2),
                  const SizedBox(width: 7),
                  BounceDot(controller: _controller, delay: 0.4),
                ])
              : Text(
                  widget.text,
                  style: robotoMedium.copyWith(
                    color: Colors.white,
                    fontSize: Dimensions.fontSizeLarge,
                  ),
                ),
        ),
      ),
    );
  }
}

class BounceDot extends StatelessWidget {
  final AnimationController controller;
  final double delay;
  final Color color;

  const BounceDot({super.key, required this.controller, required this.delay, this.color = Colors.white});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (_, __) {
        final t = ((controller.value - delay) % 1.0 + 1.0) % 1.0;
        final bounce = sin(t * pi);
        return Transform.translate(
          offset: Offset(0, -7 * bounce),
          child: Opacity(
            opacity: 0.5 + 0.5 * bounce,
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
          ),
        );
      },
    );
  }
}

class GradientText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final List<Color> colors;

  const GradientText(
    this.text, {
    super.key,
    this.style,
    this.colors = const [AppColors.gradientStart, AppColors.gradientEnd],
  });

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (bounds) => LinearGradient(
        colors: colors,
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ).createShader(bounds),
      child: Text(
        text,
        style: style,
      ),
    );
  }
}
