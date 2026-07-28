import 'dart:typed_data';

class EditModel {
  final String id;
  final String prompt;
  final Uint8List imageBytes;
  final DateTime createdAt;

  const EditModel({
    required this.id,
    required this.prompt,
    required this.imageBytes,
    required this.createdAt,
  });
}
