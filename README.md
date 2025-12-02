![category@2x](https://github.com/user-attachments/assets/533c520e-a7b0-4ea3-810d-de47260025c8)

# Essentials for Spotify

Effortlessly control your [Spotify](https://www.spotify.com/) through your [Elgato Stream Deck](https://www.elgato.com/us/en/s/welcome-to-stream-deck).\
A **[Spotify Premium](https://www.spotify.com/premium/)** account is required to use the full functionality of this plugin.

## Features

- **Plug-and-Play Setup**: In-browser, step-by-step setup; have it running in under a minute.
- **Opinionated**: No endless pages of settings, set it up once and forget about it.
- **Lag-Proof Controls**: Forget laggy or unresponsive buttons, built in a way that it simply works.
- **Interval Refresh**: Syncs data at sensible intervals with your native client so it remains up-to-date.
- **Pixel-Perfect UI**: Every icon and element is meticulously aligned for a crisp, frictionless experience.
- **Marquee Titles**: Long titles scroll smoothly on both buttons and dials so you never miss a thing.
- **Clear Visual Status**: Contextual icons and animations for loading states, errors, and warnings at a glance.

### Layouts

  Perfect layouts for **Stream Deck Neo**, **Stream Deck MK.2** and **Stream Deck +**.
  
  **Stream Deck Neo**\
  ![Stream Deck Neo Layout](https://github.com/user-attachments/assets/366705c3-d17e-4436-99ae-99d1223a2ad0)

  **Stream Deck MK.2**\
  ![Stream Deck MK.2 Layout](https://github.com/user-attachments/assets/e35e98c3-9f26-4e7e-ae5e-574dc08980de)

  **Stream Deck +**\
  ![Stream Deck + Layout](https://github.com/user-attachments/assets/9dae1e9f-34f6-4e7d-921c-a5bba3277832)

### Buttons

What's described here is the default and intended functionality of the buttons.\
You are able to configure the behavior of some of them via their settings. 

- **Setup**\
  Start here to setup Essentials for Spotify or to reset the setup process.

- **Play / Pause**\
  Toggles between playing and pausing the current song.

- **Previous Song**\
  Skips to the previous song. Hold for backward seek.

- **Next Song**\
  Advances to the next song. Hold for forward seek.

- **Backward Seek**\
  Seek backward in the current song.

- **Forward Seek**\
  Seek forward in the current song.

- **Shuffle** \
  Activates or deactivates shuffle play.

- **Loop Context**\
  Repeats the current playlist or album.

- **Loop Song**\
  Repeats the current song.

- **Mode Stack**\
  A button that combines shuffle, loop context and loop song into one.

- **Like / Unlike**\
  Adds the current song to your liked songs or removes it if already liked.

- **Explicit Indicator**\
  Shows whether the current song is explicit or not.

- **Volume Up**\
  Increases the playback volume.

- **Volume Down**\
  Decreases the playback volume.

- **Volume Mute / Unmute** \
  Toggles between muting and unmuting the volume.

- **Volume Stack** \
  A button that combines volume up, volume down and volume mute / unmute into one.

- **Song Stack**\
  Displays the information of the current song and offers a variety of control actions.

- **Song Clipboard**\
  Copies the information of the current song to the clipboard.

- **Context Information**\
  Displays the information of the current context.

- **Transfer Playback**\
  Allows you to transfer the playback to another device.

- **User Information**\
  Displays the information of the connected user.

- **Play Context**\
  Map this button to any supported Spotify URL and press it to start playing.

- **Add to Playlist**\
  Adds the currently playing song to a selected playlist. Choose your playlist from the settings and optionally display the playlist name and/or song name with automatic scrolling for long text.

### Dials
- **Playback Control**\
  Controls the playback of the current song.

  - Rotate: Previous / Next
  - Push: Play / Pause / Rotate Seek
  - Touch: Play / Pause
  - Long Touch: Like / Unlike
- **Volume Control**\
  Controls the playback volume.
  
  - Rotate: Adjust Volume
  - Push: Hold Mute
  - Touch: Mute / Unmute
- **My Playlists**\
  Navigate and play through your playlists and liked songs.
  
  - Rotate: Navigate  
  - Push: Play
  - Touch: Play
  - Long Touch: Refresh  
- **New Releases**\
  Navigate and play through your personalized new releases.
  
  - Rotate: Navigate  
  - Push: Play
  - Touch: Play
  - Long Touch: Refresh

  Icons\
    🎤 Single\
    💿 Album\
    🗂️ Compilation\
    📀 EP

## Visual Indicators

![Success](https://github.com/user-attachments/assets/150234ae-402c-4871-979c-682ff019bf79) **Success**: It worked!

![Pending](https://github.com/user-attachments/assets/b8df816e-6746-4e7e-99a2-1c201124a67d) **Pending**: Something is loading, please wait.

![Busy](https://github.com/user-attachments/assets/a701040a-b53c-403d-a1df-afab7de51c07) **Busy**: The action you're trying to perform is currently busy, wait a bit and try again later.

![API Rate Limited](https://github.com/user-attachments/assets/f6f82429-95e2-4188-b532-e6430565d1aa) **API Rate Limited**: You're doing actions too fast, wait a bit and try again later.

![Not Available](https://github.com/user-attachments/assets/2ffa7ea1-7771-43a5-88ad-90894def3d8d) **Not Available**: The action you are trying to perform is not available due to current restrictions.

![No Device](https://github.com/user-attachments/assets/da68a0f5-b821-4bd5-92d8-a2b63d7b254b) **No Device**: A device cannot be found, start your Spotify client or app, play a song and try again.

![Fatal Error](https://github.com/user-attachments/assets/4510f39a-648b-4eae-b52f-a028d02bbb42) **Fatal Error**: A fatal error has occured, please [create a new issue](https://github.com/ntanis-dev/essentials-for-spotify/issues/new).

![API Error](https://github.com/user-attachments/assets/c59c878e-390b-4d7c-9b8b-30e059a9c033) **API Error**: Something is wrong, try again later and if the issue persists [create a new issue](https://github.com/ntanis-dev/essentials-for-spotify/issues/new).

![Setup Error](https://github.com/user-attachments/assets/250f3832-8075-4289-9d91-80674d350e14) **Setup Error**: The setup has not been completed yet, please complete the setup first and try again.

When a questionmark "?" appears on top of a button, that indicates that the plugin is not sure of the button state.

For example if no song is currently playing or played recently, we can't know if it's liked or not.\
So the **Like / Unlike** button will show a questionmark "?" to indicate that.

## Installation

To install and use the plugin, follow these steps:

1. Download the latest `.streamDeckPlugin` release from [here](https://github.com/ntanis-dev/essentials-for-spotify/releases).
3. Double-click and install it.
4. Place the **Setup** button in your StreamDeck and press it.
5. A web page should open on your default internet browser, follow the instructions there.
6. Enjoy!

## Notes

**Sonos** speakers cannot be controlled through this plugin, this is a Spotify Web API limitation.

I started this project in plain JavaScript, then halfway through rewrote the buttons and dials in TypeScript.\
However I never had the grit to port the rest, so now it’s a hybrid mess, sorry about that. 😁\
I only built it because when I got my first Stream Deck, every available Spotify control plugin fell short for my taste.

## Support & Community

If you are experiencing issues or you just want to join our community, feel free to [join our Discord server](https://discord.ntanis.dev/). 

## Donations

If you've found my work helpful, any contribution is greatly appreciated.\
There's absolutely no obligation, but you may do so through my **[donate portal](https://donate.ntanis.dev/)**.

## Disclaimer

This project uses the [Spotify Web API](https://developer.spotify.com/documentation/web-api/) to fetch data and control playback.\
The use of it is subject to the [Spotify Developer Terms of Service](https://developer.spotify.com/terms).\
\
Icons are courtesy of [Icons8](https://icons8.com), used under the [Universal Multimedia License Agreement for Icons8](https://icons8.com/license).\
Icons integrated into this project must **not** be extracted or re-used as standalone assets.\
\
**Spotify** is a trademark of **Spotify AB**.\
**Stream Deck** is a trademark of **Elgato Systems GmbH**.\
\
This project is not affiliated with, endorsed, sponsored, or approved by **Spotify AB** or **Elgato Systems GmbH**.
