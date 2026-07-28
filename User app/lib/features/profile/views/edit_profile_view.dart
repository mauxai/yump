import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/profile/widgets/edit_profile_form_section.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class EditProfileView extends GetView<ProfileController> {
  const EditProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Dimensions.paddingSizeLarge,
                vertical: Dimensions.paddingSizeDefault,
              ),
              child: Row(children: [
                GestureDetector(
                  onTap: Get.back,
                  child: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Theme.of(context).colorScheme.onSurface),
                ),
                const SizedBox(width: 12),
                Text(
                  'edit_profile'.tr,
                  style: robotoBold.copyWith(color: Theme.of(context).colorScheme.onSurface, fontSize: Dimensions.fontSizeLarge),
                ),
              ]),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                child: GetBuilder<ProfileController>(
                  builder: (c) => EditProfileFormSection(
                    initialName: c.user?.name ?? '',
                    photoUrl: c.user?.avatar ?? '',
                  ),
                ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
