![category@2x](https://github.com/user-attachments/assets/533c520e-a7b0-4ea3-810d-de47260025c8)

# Essentials for Spotify

Effortlessly control your [Spotify](https://www.spotify.com/) through your [Elgato Stream Deck](https://www.elgato.com/us/en/s/welcome-to-stream-deck).\
A **[Spotify Premium](https://www.spotify.com/premium/)** account is required.

## Features

- **Plug-and-Play Setup**: In-browser, step-by-step setup; have it running in under a minute.
- **Opinionated**: No endless pages of settings, set it up once and forget about it.
- **Lag-Proof Controls**: Forget laggy or unresponsive buttons, built in a way that it simply works.
- **Interval Refresh**: Syncs data at sensible intervals with your native client so it remains up-to-date.
- **Pixel-Perfect UI**: Every icon and element is meticulously aligned for a crisp, frictionless experience.
- **Marquee Titles**: Long titles scroll smoothly on both buttons and dials so you never miss a thing.
- **Clear Visual Status**: Contextual icons and animations for loading states, errors, and warnings at a glance.

### Layouts

  Perfect layouts for **Stream Deck MK.2** and **Stream Deck +**.

  **Stream Deck MK.2**\
  ![Stream Deck MK.2 Layout](https://github.com/user-attachments/assets/8924d0f7-d82d-492b-bc6d-44315b309330)

  **Stream Deck +**\
  ![Stream Deck + Layout](https://github.com/user-attachments/assets/cf168320-1390-4d24-b4c9-beff61bd7031)

### Buttons
- **Play / Pause**
  Toggles between playing and pausing the current song.
- **Previous Song**
  Skips to the previous song.
- **Next Song**
  Advances to the next song.
- **Shuffle** 
  Activates or deactivates shuffle play.
- **Loop Context**
  Repeats the current playlist or album.
- **Loop Song**
  Repeats the current song.
- **Like / Unlike**
  Adds the current song to your liked songs or removes it if already liked.
- **Explicit Indicator**
  Shows whether the current song is explicit or not.
- **Volume Up**
  Increases the playback volume.
- **Volume Down**
  Decreases the playback volume.
- **Volume Mute / Unmute** 
  Toggles between muting and unmuting the volume.
- **Backward Seek**
  Seek backward in the current song.
- **Forward Seek**
  Seek forward in the current song.
- **Song Information**
  Displays the information of the current song.
- **User Information**
  Displays the information of the connected user.
- **Song Clipboard**
  Copies the information of the current song to the clipboard.
- **Setup**
  Start here to setup Essentials for Spotify or to reset the setup process.

### Dials
- **Playback Control**\
  Controls the playback of the current song.

  - Rotate: Previous / Next
  - Push: Rotate Seek
  - Touch: Play / Pause
- **Volume Control**\
  Controls the playback volume.
  
  - Rotate: Adjust Volume
  - Push: Hold Mute
  - Touch: Mute / Unmute
- **My Playlists**\
  Navigate and play through your playlists.
  
  - Rotate: Navigate  
  - Push: Play
  - Touch: Refresh  
- **New Releases**\
  Navigate and play through your personalized new releases.
  
  - Rotate: Navigate  
  - Push: Play
  - Touch: Refresh

## Visual Indicators

![Success](https://github.com/user-attachments/assets/e8ea52ee-2c45-4daf-863f-0f346a834bda) **Success**: It worked!\
![Pending](https://github.com/user-attachments/assets/146c3d6f-4b0f-4d0d-bb60-5876f00a9a0f) **Pending**: Something is loading, please wait.\
![Busy](https://github.com/user-attachments/assets/ef4cd0e4-b578-48a4-bc1f-fef74a332367) **Busy**: The action you're trying to perform is currently busy, wait a bit and try again later.\
![API Rate Limited](https://github.com/user-attachments/assets/9811e22a-1c6f-4440-b47d-6c1227bf00e7) **API Rate Limited**: You're doing actions too fast, wait a bit and try again later.\
![Not Available](https://github.com/user-attachments/assets/f31f7d79-69fb-46f8-beba-825ad639f419) **Not Available**: The action you are trying to perform is not available, it might due to the playing device type.\
![No Device](https://github.com/user-attachments/assets/24cccbba-bf33-4d8d-a012-e1bcc2d56039) **No Device**: A device to control cannot be found, start your Spotify client or app, play a song and then try again.\
![Fatal Error](https://github.com/user-attachments/assets/a0f910f7-802a-4cd1-82d2-cbbd278a3418) **Fatal Error**: A fatal error has occured, please [create a new issue](https://github.com/ntanis-dev/essentials-for-spotify/issues/new).\
![API Error](https://github.com/user-attachments/assets/07ab782b-781f-4e0a-885a-1684dc8bb58f) **API Error**: Something is wrong, try again later and if the issue persists [create a new issue](https://github.com/ntanis-dev/essentials-for-spotify/issues/new).\
![Setup Error](https://github.com/user-attachments/assets/dcaaff24-bdae-4f1d-9a20-80273c954b28) **Setup Error**: The setup has not been completed yet, please complete the setup first and try again.

## Manual Windows Installation

To manually install the plugin on **Windows**, follow these steps:

1. Download the latest release from [here](https://github.com/ntanis-dev/essentials-for-spotify/releases).
2. Unzip the downloaded file.
3. Place the `com.ntanis.essentials-for-spotify.sdPlugin` folder from within the ZIP inside your `%AppData%\Elgato\StreamDeck\Plugins` folder.
4. Restart the StreamDeck application.
5. Place the **Setup** button in your StreamDeck and press it, it should open a web page on your default internet browser.
6. Follow the on-screen installation instructions.
7. Enjoy!

## Notes

I started this project in plain JavaScript, then halfway through rewrote the buttons and dials in TypeScript.\
However I never had the grit to port the rest, so now it’s a hybrid mess, sorry about that. 😁\
I only built it because when I got my first Stream Deck, every available Spotify control plugin fell short for my taste.

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
