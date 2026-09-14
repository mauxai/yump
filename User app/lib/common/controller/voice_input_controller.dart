import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:speech_to_text/speech_to_text.dart';

class VoiceInputController extends GetxController implements GetxService {
  final SpeechToText _speechToText = SpeechToText();

  bool _isInitialized = false;
  bool _isListening = false;
  double _soundLevel = 0.0;
  String _lastWords = '';
  List<LocaleName> _locales = [];

  bool get isListening => _isListening;
  bool get isAvailable => _isInitialized;
  double get soundLevel => _soundLevel;
  String get lastWords => _lastWords;

  Future<bool> initSpeech() async {
    if (_isInitialized) return true;

    try {
      _isInitialized = await _speechToText.initialize(
        onError: (error) {
          debugPrint('Speech error: ${error.errorMsg}');
          _isListening = false;
          update();
        },
        onStatus: (status) {
          if (status == 'notListening' || status == 'done') {
            _isListening = false;
            update();
          }
        },
      );

      if (_isInitialized) {
        _locales = await _speechToText.locales();
      }
    } catch (e) {
      debugPrint('Speech init failed: $e');
      _isInitialized = false;
    }

    update();
    return _isInitialized;
  }

  String? _resolveLocale(String? preferred) {
    if (_locales.isEmpty) return null;

    final target = (preferred ?? Get.locale?.languageCode ?? 'en').toLowerCase();

    // 1. Try exact match (e.g. en_US, bn_IN, as_IN)
    for (final loc in _locales) {
      if (loc.localeId.toLowerCase() == target || loc.localeId.toLowerCase().replaceAll('_', '-') == target) {
        return loc.localeId;
      }
    }

    // 2. Try prefix match on languageCode
    for (final loc in _locales) {
      if (loc.localeId.toLowerCase().startsWith('${target}_') || loc.localeId.toLowerCase().startsWith('$target-')) {
        return loc.localeId;
      }
    }

    return null;
  }

  Future<void> startListening({
    required void Function(String text, bool isFinal) onResult,
    String? preferredLocale,
  }) async {
    if (!_isInitialized) {
      final available = await initSpeech();
      if (!available) {
        showCustomSnackBar('speech_not_available'.tr);
        return;
      }
    }

    if (_isListening) {
      await stopListening();
      return;
    }

    _lastWords = '';
    _isListening = true;
    update();

    final localeId = _resolveLocale(preferredLocale);

    try {
      await _speechToText.listen(
        onResult: (result) {
          _lastWords = result.recognizedWords;
          onResult(result.recognizedWords, result.finalResult);
          if (result.finalResult) {
            _isListening = false;
          }
          update();
        },
        onSoundLevelChange: (level) {
          _soundLevel = level;
          update();
        },
        localeId: localeId,
        cancelOnError: true,
        listenMode: ListenMode.dictation,
      );
    } catch (e) {
      debugPrint('Speech listen failed: $e');
      _isListening = false;
      showCustomSnackBar('speech_not_available'.tr);
      update();
    }
  }

  Future<void> stopListening() async {
    if (_isListening) {
      await _speechToText.stop();
      _isListening = false;
      _soundLevel = 0.0;
      update();
    }
  }

  Future<void> cancelListening() async {
    await _speechToText.cancel();
    _isListening = false;
    _soundLevel = 0.0;
    update();
  }

  @override
  void onClose() {
    _speechToText.cancel();
    super.onClose();
  }
}
