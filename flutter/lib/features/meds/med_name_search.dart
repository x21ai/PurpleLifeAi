import 'package:flutter/material.dart';

import 'med_dictionary.dart';
import 'meds_style.dart';

/// Autocomplete for medication name. Mirrors web
/// `src/components/meds/med-name-search.tsx`: local dictionary + user meds.
class MedNameSearch extends StatefulWidget {
  const MedNameSearch({
    super.key,
    required this.controller,
    required this.onChanged,
    required this.onSelectEntry,
    this.onCommit,
    this.userMedNames = const [],
    this.enabled = true,
    this.decoration,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final ValueChanged<MedDictEntry> onSelectEntry;
  final ValueChanged<String>? onCommit;
  final List<String> userMedNames;
  final bool enabled;
  final InputDecoration? decoration;

  @override
  State<MedNameSearch> createState() => _MedNameSearchState();
}

sealed class _SearchItem {
  const _SearchItem();
}

class _UserItem extends _SearchItem {
  const _UserItem(this.name);
  final String name;
}

class _DictItem extends _SearchItem {
  const _DictItem(this.entry);
  final MedDictEntry entry;
}

class _MedNameSearchState extends State<MedNameSearch> {
  final _focusNode = FocusNode();
  bool _editing = false;
  bool _open = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      setState(() {
        _open = true;
        _editing = true;
      });
    }
  }

  List<_SearchItem> _flatItems(String query) {
    final q = query.trim();
    if (q.isEmpty) return const [];
    final dictResults = searchMedDictionary(q, limit: 8);
    final userResults = searchUserMedNames(widget.userMedNames, q, limit: 4);
    final items = <_SearchItem>[];
    for (final name in userResults) {
      final duplicate = dictResults.any(
        (d) => d.label.toLowerCase() == name.toLowerCase(),
      );
      if (!duplicate) items.add(_UserItem(name));
    }
    for (final entry in dictResults) {
      items.add(_DictItem(entry));
    }
    return items;
  }

  void _pickDict(MedDictEntry entry) {
    widget.controller.text = entry.label;
    widget.onChanged(entry.label);
    widget.onSelectEntry(entry);
    widget.onCommit?.call(entry.label);
    setState(() {
      _open = false;
      _editing = false;
    });
    _focusNode.unfocus();
  }

  void _pickUser(String name) {
    widget.controller.text = name;
    widget.onChanged(name);
    widget.onCommit?.call(name);
    setState(() {
      _open = false;
      _editing = false;
    });
    _focusNode.unfocus();
  }

  void _clear() {
    widget.controller.clear();
    widget.onChanged('');
    setState(() {
      _open = true;
      _editing = true;
    });
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    final value = widget.controller.text;
    final showChip = value.trim().isNotEmpty && !_editing && !_open;
    final items = _flatItems(value);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: MedsSectionEyebrow('Search'),
        ),
        if (showChip)
          Row(
            children: [
              Flexible(
                child: Material(
                  color: p.surfaceSecondary,
                  shape: StadiumBorder(
                    side: BorderSide(color: p.divider),
                  ),
                  child: InkWell(
                    onTap: widget.enabled
                        ? () {
                            setState(() {
                              _editing = true;
                              _open = true;
                            });
                            _focusNode.requestFocus();
                          }
                        : null,
                    customBorder: const StadiumBorder(),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Text(
                        value,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: medsSans(fontSize: 15, color: p.textPrimary),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: widget.enabled ? _clear : null,
                tooltip: 'Clear name',
                icon: Icon(Icons.close, color: p.textSecondary),
              ),
            ],
          )
        else
          TextField(
            controller: widget.controller,
            focusNode: _focusNode,
            enabled: widget.enabled,
            onChanged: (v) {
              widget.onChanged(v);
              setState(() {
                _open = true;
                _editing = true;
              });
            },
            onSubmitted: (v) {
              final trimmed = v.trim();
              if (trimmed.isEmpty) return;
              if (items.isNotEmpty) {
                final first = items.first;
                if (first is _DictItem) {
                  _pickDict(first.entry);
                } else if (first is _UserItem) {
                  _pickUser(first.name);
                }
              } else {
                widget.onCommit?.call(trimmed);
                setState(() {
                  _open = false;
                  _editing = false;
                });
              }
            },
            style: medsSans(fontSize: 16, color: p.textPrimary),
            decoration: (widget.decoration ??
                    InputDecoration(
                      hintText: 'Search medications',
                      hintStyle: medsSans(fontSize: 14, color: p.textTertiary),
                      filled: true,
                      fillColor: p.surfaceSecondary,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: p.divider),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: p.divider),
                      ),
                      prefixIcon: Icon(Icons.search, color: p.textTertiary),
                      suffixIcon: value.isNotEmpty
                          ? IconButton(
                              onPressed: _clear,
                              icon: Icon(Icons.close, color: p.textTertiary),
                            )
                          : null,
                    ))
                .copyWith(
              prefixIcon: Icon(Icons.search, color: p.textTertiary),
            ),
          ),
        if (_open && items.isNotEmpty) ...[
          const SizedBox(height: 8),
          Material(
            color: p.surfaceSecondary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: p.divider),
            ),
            clipBehavior: Clip.antiAlias,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 256),
              child: ListView.separated(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: items.length,
                separatorBuilder: (_, __) =>
                    Divider(height: 1, color: p.divider),
                itemBuilder: (context, index) {
                  final item = items[index];
                  if (item is _UserItem) {
                    return ListTile(
                      dense: true,
                      minVerticalPadding: 12,
                      title: Text(
                        item.name,
                        style: medsSans(fontSize: 15, color: p.textPrimary),
                      ),
                      trailing: Text(
                        'Yours',
                        style: medsSans(fontSize: 12, color: p.textTertiary),
                      ),
                      onTap: () => _pickUser(item.name),
                    );
                  }
                  final entry = (item as _DictItem).entry;
                  return ListTile(
                    dense: true,
                    minVerticalPadding: 12,
                    title: Text(
                      entry.label,
                      style: medsSans(fontSize: 15, color: p.textPrimary),
                    ),
                    trailing: Text(
                      entry.kind,
                      style: medsSans(fontSize: 12, color: p.textTertiary),
                    ),
                    onTap: () => _pickDict(entry),
                  );
                },
              ),
            ),
          ),
        ],
      ],
    );
  }
}
