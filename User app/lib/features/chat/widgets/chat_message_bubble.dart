import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/chat/controllers/chat_controller.dart';
import 'package:lumen/features/chat/models/chat_models.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ChatMessageBubble extends StatelessWidget {
  final ChatMessageModel message;

  const ChatMessageBubble({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    if (message.isUser) {
      return _buildUserBubble(context);
    } else {
      return _buildAssistantBubble(context);
    }
  }

  Widget _buildUserBubble(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(Dimensions.radiusLarge),
            topRight: const Radius.circular(Dimensions.radiusLarge),
            bottomLeft: const Radius.circular(Dimensions.radiusLarge),
            bottomRight: Radius.circular(Dimensions.radiusSmall),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (message.attachments.isNotEmpty) ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: message.attachments.map((att) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.attach_file, size: 14, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          att.fileName,
                          style: robotoRegular.copyWith(fontSize: 11, color: Colors.white),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 6),
            ],
            SelectableText(
              message.content,
              style: robotoRegular.copyWith(
                color: Colors.white,
                fontSize: Dimensions.fontSizeDefault,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAssistantBubble(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.88),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(Dimensions.radiusLarge),
            topRight: const Radius.circular(Dimensions.radiusLarge),
            bottomRight: const Radius.circular(Dimensions.radiusLarge),
            bottomLeft: Radius.circular(Dimensions.radiusSmall),
          ),
          border: Border.all(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.auto_awesome, color: Colors.white, size: 12),
                ),
                const SizedBox(width: 8),
                Text(
                  'assistant'.tr,
                  style: robotoMedium.copyWith(
                    fontSize: Dimensions.fontSizeSmall,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            MarkdownBody(
              data: message.content.isEmpty && message.isStreaming ? '...' : message.content,
              selectable: true,
              styleSheet: MarkdownStyleSheet(
                p: robotoRegular.copyWith(
                  fontSize: Dimensions.fontSizeDefault,
                  color: Theme.of(context).colorScheme.onSurface,
                  height: 1.4,
                ),
                code: robotoRegular.copyWith(
                  backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  fontSize: Dimensions.fontSizeSmall,
                ),
                codeblockDecoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            if (message.citations.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'sources'.tr,
                style: robotoMedium.copyWith(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 4),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: message.citations.map((c) {
                  return Chip(
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
                    label: Text(c.title, style: robotoRegular.copyWith(fontSize: 10)),
                    backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  );
                }).toList(),
              ),
            ],
            if (!message.isStreaming && message.content.isNotEmpty) ...[
              const SizedBox(height: 8),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline.withOpacity(0.3)),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.copy_rounded, size: 16),
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: message.content));
                      showCustomSnackBar('copied_to_clipboard'.tr, isError: false);
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.thumb_up_outlined, size: 16),
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      Get.find<ChatController>().sendFeedback(message.id, 1);
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.thumb_down_outlined, size: 16),
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      Get.find<ChatController>().sendFeedback(message.id, -1);
                    },
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
