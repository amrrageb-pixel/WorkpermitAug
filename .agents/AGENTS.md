## HSE & NEBOSH Development Guidelines
When building or modifying Permit-to-Work (PTW) forms and logic:
1. **Continuous Gas Testing**: Always implement a log for periodic gas readings (LEL, O2, H2S) rather than a single pre-entry check for Confined Spaces.
2. **Strict Spatial Conflicts**: Implement hard blocks (not just warnings) for conflicting permits (e.g., Hot Work near Flammable/Painting tasks).
3. **Toolbox Talk Accountability**: Require individual worker acknowledgment or digital signatures for Toolbox Talks, not just a supervisor checkbox.
4. **Advanced LOTO**: Include "Double Block and Bleed" verification for hazardous energy isolation.
