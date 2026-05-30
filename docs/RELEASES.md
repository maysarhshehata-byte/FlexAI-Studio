# FlexAI Studio Releases

## v1.0.0-preview.002
Date: 2026-05-31
Type: Backend Update
Platform: Railway Backend
Frontend Build Required: No
EAS Update Required: No
Railway Deploy Required: Yes

### Summary
Switched FlexAI Studio backend provider from OpenRouter to the official OpenAI API.

### Changed
- Replaced OpenRouter endpoint with OpenAI endpoint:
  - https://api.openai.com/v1/chat/completions
- Backend now reads:
  - OPENAI_API_KEY
  - OPENAI_MODEL
- /chat route now returns responses directly from OpenAI.

### Improved
- Added clearer backend error logging for Railway logs.
- Added better handling for non-JSON API responses.
- Added clearer OpenAI API error output.

### Validation
- Tested /chat endpoint successfully using curl.
- Confirmed response is returned from OpenAI model.
- No frontend change required because the app still uses the same Railway API URL.

### Test Checklist
- [x] Railway backend deployed successfully.
- [x] /chat endpoint responds successfully.
- [x] OpenAI API key works.
- [x] App can continue using existing Railway backend URL.

---

## v1.0.0-preview.001
Date: 2026-05-30
Type: EAS Build
Platform: iOS
Profile: preview
Channel: preview
Runtime: 1.0.0
Status: Installed and working

### Summary
First working installed iOS preview build of FlexAI Studio with EAS live updates configured.

### Included
- FlexAI Studio app identity.
- iOS preview build installed on iPhone.
- EAS preview channel configured.
- Live updates working through EAS Update.
- Railway backend connected.
- Local chat history and auto-save.
- Side menu history panel.
- Message actions, typewriter response, and swipe timestamps.
