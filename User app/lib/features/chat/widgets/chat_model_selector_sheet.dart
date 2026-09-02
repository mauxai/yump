import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/chat/controllers/chat_controller.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ChatModelSelectorSheet extends StatelessWidget {
  const ChatModelSelectorSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ChatController>(
      builder: (chatCtrl) {
        final dashboardCtrl = Get.find<DashboardController>();
        final allModels = dashboardCtrl.aiModelList;
        final models = allModels.where((m) => m.type == 'CHAT' || m.type == null).toList();

        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
          ),
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'select_ai_model'.tr,
                  style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                ),
                const SizedBox(height: 12),
                if (models.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                      child: Text(
                        'gpt-4o-mini',
                        style: robotoMedium.copyWith(color: AppColors.gradientStart),
                      ),
                    ),
                  )
                else
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: models.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final m = models[i];
                        final isSelected = chatCtrl.selectedModel == m.modelId || chatCtrl.selectedModel == m.id;

                        return InkWell(
                          onTap: () {
                            chatCtrl.setModel(m.modelId ?? m.id ?? 'gpt-4o-mini');
                            Navigator.pop(context);
                          },
                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.gradientStart.withOpacity(0.1)
                                  : Theme.of(context).colorScheme.surface,
                              borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                              border: Border.all(
                                color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.outline,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.auto_awesome,
                                  size: 18,
                                  color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        m.label ?? m.modelId ?? '',
                                        style: robotoMedium.copyWith(
                                          color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurface,
                                        ),
                                      ),
                                      if (m.provider != null)
                                        Text(
                                          m.provider!.toUpperCase(),
                                          style: robotoRegular.copyWith(
                                            fontSize: 10,
                                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(Icons.check_circle, color: AppColors.gradientStart, size: 20),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
