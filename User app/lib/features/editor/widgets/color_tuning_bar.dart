import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ColorTuningBar extends StatefulWidget {
  const ColorTuningBar({super.key});

  @override
  State<ColorTuningBar> createState() => _ColorTuningBarState();
}

class _ColorTuningBarState extends State<ColorTuningBar> {
  double _brightness = 0;
  double _contrast = 0;
  double _saturation = 0;
  double _warmth = 0;
  double _fade = 0;

  void _apply() {
    final parts = <String>[];
    if (_brightness != 0) {
      parts.add('${_brightness > 0 ? 'increase' : 'decrease'} brightness by ${_brightness.abs().toInt()}%');
    }
    if (_contrast != 0) {
      parts.add('${_contrast > 0 ? 'increase' : 'decrease'} contrast by ${_contrast.abs().toInt()}%');
    }
    if (_saturation != 0) {
      parts.add('${_saturation > 0 ? 'boost' : 'reduce'} saturation by ${_saturation.abs().toInt()}%');
    }
    if (_warmth != 0) {
      parts.add(_warmth > 0 ? 'add ${_warmth.toInt()}% warm golden tones' : 'add ${_warmth.abs().toInt()}% cool blue tones');
    }
    if (_fade != 0) {
      parts.add('add ${_fade.toInt()}% matte fade');
    }

    if (parts.isEmpty) {
      Get.find<EditorController>().selectTool(null);
      return;
    }

    final prompt = 'Adjust the image: ${parts.join(', ')}. Keep the composition and subjects unchanged.';
    Get.find<EditorController>().generateEdit(promptOverride: prompt);
    Get.find<EditorController>().selectTool(null);
  }

  void _reset() {
    setState(() {
      _brightness = 0;
      _contrast = 0;
      _saturation = 0;
      _warmth = 0;
      _fade = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outline)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('color_tuning'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
              Row(
                children: [
                  TextButton(
                    onPressed: _reset,
                    child: Text('reset'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gradientStart,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: _apply,
                    child: Text('apply'.tr),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          _buildSlider('brightness'.tr, _brightness, -100, 100, (v) => setState(() => _brightness = v)),
          _buildSlider('contrast'.tr, _contrast, -100, 100, (v) => setState(() => _contrast = v)),
          _buildSlider('saturation'.tr, _saturation, -100, 100, (v) => setState(() => _saturation = v)),
          _buildSlider('warmth'.tr, _warmth, -100, 100, (v) => setState(() => _warmth = v)),
          _buildSlider('fade'.tr, _fade, 0, 100, (v) => setState(() => _fade = v)),
        ],
      ),
    );
  }

  Widget _buildSlider(String label, double val, double min, double max, ValueChanged<double> onChanged) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(label, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall)),
        ),
        Expanded(
          child: Slider(
            value: val,
            min: min,
            max: max,
            divisions: 40,
            activeColor: AppColors.gradientStart,
            onChanged: onChanged,
          ),
        ),
        SizedBox(
          width: 36,
          child: Text('${val.toInt()}%', style: robotoRegular.copyWith(fontSize: 10)),
        ),
      ],
    );
  }
}
