# FlexAI Studio Changelog

## v1.0.0-preview.002
Date: 2026-05-31
Type: Backend Update

### Changed
- Switched backend provider from OpenRouter to official OpenAI API.
- Backend now uses OPENAI_API_KEY and OPENAI_MODEL.
- /chat route now calls https://api.openai.com/v1/chat/completions.

### Fixed
- Improved backend error logging for Railway troubleshooting.
- Added safer handling for non-JSON provider responses.

### Technical
- Frontend build required: No
- EAS update required: No
- Railway deploy required: Yes

---

## v1.0.0-preview.001
Date: 2026-05-30
Type: Initial iOS Preview Build

### Added
- Installed iOS preview build.
- EAS Update preview channel.
- Railway backend connection.
- Local chat sessions using AsyncStorage.
- Side menu chat history.
- New chat, delete chat, and open saved chats.
- Typewriter-style AI responses.
- Stop response button.
- Copy, regenerate, edit, and selectable message text.
- Swipe-to-show timestamps.
- Keyboard tap dismissal behavior.

### Technical
- Channel: preview
- Runtime: 1.0.0
- Backend: Railway
- Update method: EAS Update for JS/UI changes
- Build method: EAS Build for native/config changes
