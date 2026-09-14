import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/chat/controllers/chat_controller.dart';
import 'package:lumen/features/chat/widgets/chat_drawer_widget.dart';
import 'package:lumen/features/chat/widgets/chat_input_section.dart';
import 'package:lumen/features/chat/widgets/chat_message_bubble.dart';
import 'package:lumen/features/chat/widgets/chat_model_selector_sheet.dart';
import 'package:lumen/features/chat/widgets/chat_welcome_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ChatView extends GetView<ChatController> {
  const ChatView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      drawer: const ChatDrawerWidget(),
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu_rounded),
            onPressed: () {
              controller.loadConversations();
              Scaffold.of(ctx).openDrawer();
            },
          ),
        ),
        title: GetBuilder<ChatController>(
          builder: (c) {
            return GestureDetector(
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => const ChatModelSelectorSheet(),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.auto_awesome, size: 14, color: AppColors.gradientStart),
                    const SizedBox(width: 6),
                    Text(
                      c.selectedModel,
                      style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.keyboard_arrow_down_rounded, size: 16),
                  ],
                ),
              ),
            );
          },
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            tooltip: 'new_chat'.tr,
            onPressed: controller.startNewChat,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: GetBuilder<ChatController>(
              builder: (ctrl) {
                if (ctrl.isLoadingMessages) {
                  return const Center(child: CircularProgressIndicator(strokeWidth: 2));
                }

                if (ctrl.messages.isEmpty) {
                  return _buildEmptyState(context, ctrl);
                }

                return ListView.builder(
                  controller: ctrl.scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: ctrl.messages.length,
                  itemBuilder: (_, i) => ChatMessageBubble(message: ctrl.messages[i]),
                );
              },
            ),
          ),
          const ChatInputSection(),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, ChatController ctrl) {
    return ChatWelcomeWidget(
      onSelectPrompt: (prompt) => ctrl.sendMessage(prompt),
    );
  }
}
