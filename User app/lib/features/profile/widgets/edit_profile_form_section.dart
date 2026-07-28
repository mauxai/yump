import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/common/widgets/custom_text_field.dart';
import 'package:lumen/common/widgets/user_avatar.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class EditProfileFormSection extends StatefulWidget {
  final String initialName;
  final String photoUrl;

  const EditProfileFormSection({super.key, required this.initialName, required this.photoUrl});

  @override
  State<EditProfileFormSection> createState() => _EditProfileFormSectionState();
}

class _EditProfileFormSectionState extends State<EditProfileFormSection> {
  late final TextEditingController _nameController;
  final _passwordController = TextEditingController();
  final _passwordFocus = FocusNode();
  XFile? _pickedImage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _passwordController.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image != null) setState(() => _pickedImage = image);
  }

  void _submit() {
    Get.find<ProfileController>().updateProfile(
      name: _nameController.text.trim(),
      password: _passwordController.text.isEmpty ? null : _passwordController.text,
      avatar: _pickedImage,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _AvatarPicker(
          pickedImage: _pickedImage,
          photoUrl: widget.photoUrl,
          name: widget.initialName,
          onTap: _pickImage,
        ),

        const SizedBox(height: 32),

        CustomTextField(
          controller: _nameController,
          hint: 'name_hint'.tr,
          prefixIcon: Icons.person_outline,
          textInputAction: TextInputAction.next,
          onSubmitted: () => FocusScope.of(context).requestFocus(_passwordFocus),
        ),

        const SizedBox(height: 12),

        CustomTextField(
          controller: _passwordController,
          hint: 'new_password_hint'.tr,
          prefixIcon: Icons.lock_outline,
          isPassword: true,
          textInputAction: TextInputAction.done,
          focusNode: _passwordFocus,
          onSubmitted: _submit,
        ),

        const SizedBox(height: 32),

        GetBuilder<ProfileController>(
          builder: (c) => CustomGradientButton(
            text: 'update_profile'.tr,
            isLoading: c.isUpdating,
            onTap: c.isUpdating ? () {} : _submit,
          ),
        ),
      ],
    );
  }
}

class _AvatarPicker extends StatelessWidget {
  final XFile? pickedImage;
  final String photoUrl;
  final String name;
  final VoidCallback onTap;

  const _AvatarPicker({required this.pickedImage, required this.photoUrl, required this.name, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final Widget avatar = pickedImage != null
        ? ClipRRect(
            borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
            child: Image.file(File(pickedImage!.path), width: 96, height: 96, fit: BoxFit.cover),
          )
        : UserAvatar(name: name, photoUrl: photoUrl, size: 96, borderRadius: Dimensions.radiusExtraLarge);

    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            avatar,

            Positioned(
              bottom: -4,
              right: -4,
              child: GestureDetector(
                onTap: onTap,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    gradient: AppColors.mainGradient,
                    shape: BoxShape.circle,
                    border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2),
                  ),
                  child: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 16),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 10),

        GestureDetector(
          onTap: onTap,
          child: Text(
            'pick_photo'.tr,
            style: robotoMedium.copyWith(
              color: AppColors.gradientStart,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),
        ),
      ],
    );
  }
}
