# Safe native retexture workflow

1. Probe and import the selected YTD/YDR/YDD/YFT source bundle.
2. Record source hashes and the adapter/version that produced the document.
3. List editable texture slots with their stable references, dimensions,
   ownership, compression, mip count, alpha mode, and color-space intent.
4. Read the chosen slot into a standard working image without changing the
   immutable source bytes.
5. Apply the requested edit and verify dimensions, alpha, and channel meaning.
6. Submit a texture patch keyed by the stable slot reference.
7. Ask the adapter to encode according to native constraints; do not assume a
   PNG byte stream can be written into a DDS/native field.
8. Export to a new staging directory using targeted-patch fidelity.
9. Validate the complete emitted bundle, compare the change manifest to the
   requested slot, and reopen the staged result for a visual/read-back check.
10. Report output paths, hashes, fidelity, warnings, and any dependency the user
    must install together.

Stop before export if the adapter reports `preview-only`, cannot resolve the
texture owner, cannot preserve a required native encoding, or detects a source
edition it does not support.
