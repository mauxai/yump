import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/activity/controllers/activity_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ActivitySearchWidget extends StatefulWidget {
  const ActivitySearchWidget({super.key});

  @override
  State<ActivitySearchWidget> createState() => _ActivitySearchWidgetState();
}

class _ActivitySearchWidgetState extends State<ActivitySearchWidget> {
  final _textController = TextEditingController();
  bool _hasText = false;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    setState(() => _hasText = value.isNotEmpty);
  }

  void _onSubmitted(String value) {
    Get.find<ActivityController>().onSearch(value.trim());
  }

  void _onClear() {
    _textController.clear();
    setState(() => _hasText = false);
    Get.find<ActivityController>().clearSearch();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: TextField(
        controller: _textController,
        onChanged: _onChanged,
        onSubmitted: _onSubmitted,
        textInputAction: TextInputAction.search,
        style: robotoRegular.copyWith(
          color: Theme.of(context).colorScheme.onSurface,
          fontSize: Dimensions.fontSizeDefault,
        ),
        decoration: InputDecoration(
          hintText: 'search_prompts_hint'.tr,
          hintStyle: robotoRegular.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontSize: Dimensions.fontSizeDefault,
          ),
          prefixIcon: Icon(
            Icons.search_rounded,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            size: 20,
          ),
          suffixIcon: _hasText
              ? GestureDetector(
                  onTap: _onClear,
                  child: Icon(
                    Icons.close_rounded,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    size: 18,
                  ),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            vertical: Dimensions.paddingSizeSmall,
          ),
        ),
      ),
    );
  }
}
