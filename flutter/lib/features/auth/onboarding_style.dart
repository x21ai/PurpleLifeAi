import 'package:flutter/material.dart';

import 'ploy_access_chrome.dart';

TextStyle onboardingTitle() {
  return const TextStyle(
    fontSize: 33,
    height: 1.02,
    fontWeight: FontWeight.w600,
    letterSpacing: -1.65,
    color: PloyAccessColors.ink,
  );
}

TextStyle onboardingSubtitle() {
  return const TextStyle(
    fontSize: 15,
    height: 1.45,
    color: PloyAccessColors.muted,
  );
}

TextStyle onboardingFieldLabel() {
  return const TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: PloyAccessColors.ink,
  );
}

TextStyle onboardingEyebrow() {
  return const TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.72,
    color: PloyAccessColors.accent,
  );
}

TextStyle onboardingHint() {
  return const TextStyle(
    fontSize: 13,
    height: 1.4,
    color: PloyAccessColors.muted,
  );
}

TextStyle onboardingCategoryLabel() {
  return const TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: PloyAccessColors.muted,
  );
}

InputDecoration onboardingInputDecoration(String hint) {
  return ployFieldDecoration().copyWith(
    hintText: hint,
    hintStyle: const TextStyle(color: PloyAccessColors.muted, fontSize: 14),
  );
}
