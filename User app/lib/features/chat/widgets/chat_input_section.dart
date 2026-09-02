import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/chat/controllers/chat_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ChatInputSection extends StatefulWidget {
  const ChatInputSection({super.key});

  @override
  State<ChatInputSection> createState() => _ChatInputSectionState();
}

class _ChatInputSectionState extends State<ChatInputSection> {
  final TextEditingController _textController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _canSend = false;

  @override
  void initState() {
    super.initState();
    _textController.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    final hasText = _textController.text.trim().isNotEmpty;
    if (hasText != _canSend) {
      setState(() => _canSend = hasText);
    }
  }

  @override
  void dispose() {
    _textController.removeListener(_onTextChanged);
    _textController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _send() {
    final text = _textController.text.trim();
    final ctrl = Get.find<ChatController>();
    if (text.isEmpty && ctrl.pendingAttachments.isEmpty) return;

    _textController.clear();
    ctrl.sendMessage(text);
  }

  Future<void> _pickAttachment() async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.gradientStart),
                title: Text('photos'.tr, style: robotoMedium),
                onTap: () async {
                  Navigator.pop(context);
                  final picker = ImagePicker();
                  final image = await picker.pickImage(source: ImageSource.gallery);
                  if (image != null) {
                    Get.find<ChatController>().addAttachment(File(image.path));
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.picture_as_pdf_outlined, color: AppColors.gradientStart),
                title: Text('document_pdf'.tr, style: robotoMedium),
                onTap: () async {
                  Navigator.pop(context);
                  final result = await FilePicker.platform.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: ['pdf', 'txt', 'doc', 'docx'],
                  );
                  if (result != null && result.files.single.path != null) {
                    Get.find<ChatController>().addAttachment(File(result.files.single.path!));
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ChatController>(
      builder: (ctrl) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            border: Border(
              top: BorderSide(
                color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
                width: 1,
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (ctrl.pendingAttachments.isNotEmpty)
                  Container(
                    height: 48,
                    margin: const EdgeInsets.only(bottom: 6),
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: ctrl.pendingAttachments.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final att = ctrl.pendingAttachments[i];
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.attach_file, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                att.fileName,
                                style: robotoRegular.copyWith(fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(width: 4),
                              GestureDetector(
                                onTap: () => ctrl.removePendingAttachment(i),
                                child: const Icon(Icons.close, size: 16),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.gradientStart),
                      onPressed: ctrl.isStreaming ? null : _pickAttachment,
                    ),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
                          ),
                        ),
                        child: TextField(
                          controller: _textController,
                          focusNode: _focusNode,
                          maxLines: 4,
                          minLines: 1,
                          textCapitalization: TextCapitalization.sentences,
                          style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault),
                          decoration: InputDecoration(
                            hintText: 'ask_anything'.tr,
                            hintStyle: robotoRegular.copyWith(
                              color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.6),
                              fontSize: Dimensions.fontSizeDefault,
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                          onSubmitted: (_) => _send(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (ctrl.isStreaming)
                      IconButton(
                        icon: const Icon(Icons.stop_circle_rounded, color: Colors.redAccent, size: 30),
                        onPressed: ctrl.stopStreaming,
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          gradient: (_canSend || ctrl.pendingAttachments.isNotEmpty)
                              ? const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd])
                              : null,
                          color: (_canSend || ctrl.pendingAttachments.isNotEmpty)
                              ? null
                              : Theme.of(context).colorScheme.surfaceContainerHighest,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: Icon(
                            Icons.arrow_upward_rounded,
                            color: (_canSend || ctrl.pendingAttachments.isNotEmpty)
                                ? Colors.white
                                : Theme.of(context).colorScheme.onSurfaceVariant,
                            size: 20,
                          ),
                          onPressed: (_canSend || ctrl.pendingAttachments.isNotEmpty) ? _send : null,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
