import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lumen/common/controller/voice_input_controller.dart';
import 'package:lumen/core/theme/app_colors.dart';

class VoiceInputButtonWidget extends StatefulWidget {
  final TextEditingController textController;
  final VoidCallback? onTextChanged;
  final double size;
  final double iconSize;
  final Color? color;

  const VoiceInputButtonWidget({
    super.key,
    required this.textController,
    this.onTextChanged,
    this.size = 36.0,
    this.iconSize = 20.0,
    this.color,
  });

  @override
  State<VoiceInputButtonWidget> createState() => _VoiceInputButtonWidgetState();
}

class _VoiceInputButtonWidgetState extends State<VoiceInputButtonWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;
  String _preSpeechText = '';

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _handleToggle(VoiceInputController ctrl) async {
    HapticFeedback.lightImpact();

    if (ctrl.isListening) {
      _pulseController.stop();
      _pulseController.reset();
      await ctrl.stopListening();
    } else {
      _preSpeechText = widget.textController.text.trim();
      _pulseController.repeat(reverse: true);

      await ctrl.startListening(
        onResult: (text, isFinal) {
          if (text.isEmpty) return;

          final combined = _preSpeechText.isEmpty
              ? text
              : '$_preSpeechText $text';

          widget.textController.text = combined;
          widget.textController.selection = TextSelection.fromPosition(
            TextPosition(offset: widget.textController.text.length),
          );
          widget.onTextChanged?.call();

          if (isFinal) {
            _pulseController.stop();
            _pulseController.reset();
          }
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VoiceInputController>(
      builder: (voiceCtrl) {
        final isListening = voiceCtrl.isListening;

        if (!isListening && _pulseController.isAnimating) {
          _pulseController.stop();
          _pulseController.reset();
        }

        final defaultColor = widget.color ??
            Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.8);

        return Tooltip(
          message: isListening ? 'tap_to_stop'.tr : 'tap_to_speak'.tr,
          child: GestureDetector(
            onTap: () => _handleToggle(voiceCtrl),
            child: AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (ctx, child) {
                return Transform.scale(
                  scale: isListening ? _pulseAnimation.value : 1.0,
                  child: Container(
                    width: widget.size,
                    height: widget.size,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: isListening
                          ? const LinearGradient(
                              colors: [AppColors.gradientStart, AppColors.gradientEnd],
                            )
                          : null,
                      color: isListening
                          ? null
                          : Colors.transparent,
                      boxShadow: isListening
                          ? [
                              BoxShadow(
                                color: AppColors.gradientStart.withValues(alpha: 0.4),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Icon(
                        isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                        size: widget.iconSize,
                        color: isListening ? Colors.white : defaultColor,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }
}
