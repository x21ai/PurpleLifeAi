import 'package:flutter/material.dart';

import '../shared/merged_style.dart';

TextStyle onboardingTitle() {
  return medsSerif(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    color: mergedPalette().textPrimary,
  );
}

TextStyle onboardingSubtitle() {
  return medsSans(
    fontSize: 15,
    height: 1.45,
    color: mergedPalette().textPrimary.withValues(alpha: 0.82),
  );
}

TextStyle onboardingFieldLabel() {
  return medsSans(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: mergedPalette().textPrimary.withValues(alpha: 0.9),
  );
}

TextStyle onboardingEyebrow() {
  return medsEyebrow(palette: mergedPalette());
}

TextStyle onboardingHint() {
  return medsSans(fontSize: 13, color: mergedPalette().textTertiary);
}

TextStyle onboardingCategoryLabel() {
  return medsSans(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: mergedPalette().textTertiary,
  );
}

InputDecoration onboardingInputDecoration(String hint) {
  final p = mergedPalette();
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: p.textTertiary.withValues(alpha: 0.6)),
    filled: true,
    fillColor: p.textPrimary.withValues(alpha: 0.06),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: p.divider),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: p.divider),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: p.purplePrimary.withValues(alpha: 0.5)),
    ),
  );
}
