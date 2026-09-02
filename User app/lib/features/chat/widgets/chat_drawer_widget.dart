import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_text_field.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/chat/controllers/chat_controller.dart';
import 'package:lumen/features/chat/models/chat_models.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ChatDrawerWidget extends StatefulWidget {
  const ChatDrawerWidget({super.key});

  @override
  State<ChatDrawerWidget> createState() => _ChatDrawerWidgetState();
}

class _ChatDrawerWidgetState extends State<ChatDrawerWidget> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showRenameDialog(BuildContext context, ConversationModel conv) {
    final nameController = TextEditingController(text: conv.title);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('rename_chat'.tr, style: robotoBold),
        content: TextField(
          controller: nameController,
          autofocus: true,
          decoration: InputDecoration(hintText: 'enter_new_title'.tr),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('cancel'.tr),
          ),
          ElevatedButton(
            onPressed: () {
              final newName = nameController.text.trim();
              if (newName.isNotEmpty) {
                Get.find<ChatController>().renameConversation(conv.id, newName);
              }
              Navigator.pop(ctx);
            },
            child: Text('save'.tr),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, ConversationModel conv) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('delete_conversation'.tr, style: robotoBold),
        content: Text('delete_conversation_confirm'.tr),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('cancel'.tr),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () {
              Get.find<ChatController>().deleteConversation(conv.id);
              Navigator.pop(ctx);
            },
            child: Text('delete'.tr, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Theme.of(context).cardColor,
      child: SafeArea(
        child: GetBuilder<ChatController>(
          builder: (ctrl) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(
                    children: [
                      const Icon(Icons.forum_outlined, color: AppColors.gradientStart),
                      const SizedBox(width: 8),
                      Text('chat_history'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.add_comment_outlined, color: AppColors.gradientStart),
                        onPressed: () {
                          ctrl.startNewChat();
                          Navigator.pop(context);
                        },
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'search_conversations'.tr,
                      prefixIcon: const Icon(Icons.search, size: 20),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                        borderSide: BorderSide(color: Theme.of(context).colorScheme.outline),
                      ),
                    ),
                    onChanged: (val) => ctrl.loadConversations(search: val),
                  ),
                ),
                Expanded(
                  child: ctrl.isLoadingConversations
                      ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                      : ctrl.conversations.isEmpty
                          ? Center(
                              child: Text(
                                'no_conversations_found'.tr,
                                style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                              ),
                            )
                          : ListView(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              children: [
                                if (ctrl.pinnedConversations.isNotEmpty) ...[
                                  _buildSectionHeader('pinned'.tr, Icons.push_pin_outlined),
                                  ...ctrl.pinnedConversations.map((c) => _buildItem(c, ctrl)),
                                ],
                                if (ctrl.todayConversations.isNotEmpty) ...[
                                  _buildSectionHeader('today'.tr, Icons.today_outlined),
                                  ...ctrl.todayConversations.map((c) => _buildItem(c, ctrl)),
                                ],
                                if (ctrl.yesterdayConversations.isNotEmpty) ...[
                                  _buildSectionHeader('yesterday'.tr, Icons.event_outlined),
                                  ...ctrl.yesterdayConversations.map((c) => _buildItem(c, ctrl)),
                                ],
                                if (ctrl.olderConversations.isNotEmpty) ...[
                                  _buildSectionHeader('older'.tr, Icons.history_rounded),
                                  ...ctrl.olderConversations.map((c) => _buildItem(c, ctrl)),
                                ],
                              ],
                            ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(
            title,
            style: robotoMedium.copyWith(
              fontSize: Dimensions.fontSizeExtraSmall,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(ConversationModel conv, ChatController ctrl) {
    final isSelected = ctrl.activeConversationId == conv.id;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 2),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.gradientStart.withOpacity(0.12) : Colors.transparent,
        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
      ),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
        leading: Icon(
          conv.pinned ? Icons.push_pin : Icons.chat_bubble_outline_rounded,
          size: 18,
          color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        title: Text(
          conv.title,
          style: robotoRegular.copyWith(
            fontSize: Dimensions.fontSizeSmall,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurface,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: PopupMenuButton<String>(
          icon: Icon(Icons.more_vert, size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant),
          onSelected: (action) {
            if (action == 'pin') {
              ctrl.togglePin(conv.id, conv.pinned);
            } else if (action == 'rename') {
              _showRenameDialog(context, conv);
            } else if (action == 'delete') {
              _showDeleteDialog(context, conv);
            }
          },
          itemBuilder: (_) => [
            PopupMenuItem(
              value: 'pin',
              child: Row(
                children: [
                  Icon(conv.pinned ? Icons.push_pin_outlined : Icons.push_pin, size: 16),
                  const SizedBox(width: 8),
                  Text(conv.pinned ? 'unpin'.tr : 'pin'.tr),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'rename',
              child: Row(
                children: [
                  const Icon(Icons.edit_outlined, size: 16),
                  const SizedBox(width: 8),
                  Text('rename'.tr),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                  const SizedBox(width: 8),
                  Text('delete'.tr, style: const TextStyle(color: Colors.redAccent)),
                ],
              ),
            ),
          ],
        ),
        onTap: () {
          ctrl.selectConversation(conv.id);
          Navigator.pop(context);
        },
      ),
    );
  }
}
