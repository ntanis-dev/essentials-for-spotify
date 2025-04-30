import StreamDeck from '@elgato/streamdeck'
import PlayPauseButton from './../actions/play-pause-button'
import PreviousSongButton from './../actions/previous-song-button'
import NextSongButton from './../actions/next-song-button'
import LoopContextButton from './../actions/loop-context-button'
import LoopSongButton from '../actions/loop-song-button'
import ShuffleButton from './../actions/shuffle-button'
import LikeUnlikeButton from './../actions/like-unlike-button'
import VolumeUpButton from './../actions/volume-up-button'
import VolumeDownButton from './../actions/volume-down-button'
import VolumeMuteUnmuteButton from './../actions/volume-mute-unmute-button'
import SongInformationButton from './../actions/song-information-button'
import UserInformationButton from './../actions/user-information-button'
import SongClipboardButton from './../actions/song-clipboard-button'
import BackwardSeekButton from './../actions/backward-seek-button'
import ForwardSeekButton from './../actions/forward-seek-button'
import SongExplicitButton from './../actions/song-explicit-button'
import SetupButton from './../actions/setup-button'
import VolumeControlDial from './../actions/volume-control-dial'
import PlaybackControlDial from './../actions/playback-control-dial'
import MyPlaylistsDial from './../actions/my-playlists-dial'
import NewReleasesDial from '../actions/new-releases-dial'

export default {
	register: () => {
		StreamDeck.actions.registerAction(new PlayPauseButton())
		StreamDeck.actions.registerAction(new PreviousSongButton())
		StreamDeck.actions.registerAction(new NextSongButton())
		StreamDeck.actions.registerAction(new LoopContextButton())
		StreamDeck.actions.registerAction(new LoopSongButton())
		StreamDeck.actions.registerAction(new ShuffleButton())
		StreamDeck.actions.registerAction(new LikeUnlikeButton())
		StreamDeck.actions.registerAction(new VolumeUpButton())
		StreamDeck.actions.registerAction(new VolumeDownButton())
		StreamDeck.actions.registerAction(new VolumeMuteUnmuteButton())
		StreamDeck.actions.registerAction(new SongInformationButton())
		StreamDeck.actions.registerAction(new UserInformationButton())
		StreamDeck.actions.registerAction(new SongClipboardButton())
		StreamDeck.actions.registerAction(new BackwardSeekButton())
		StreamDeck.actions.registerAction(new ForwardSeekButton())
		StreamDeck.actions.registerAction(new SongExplicitButton())
		StreamDeck.actions.registerAction(new SetupButton())
		StreamDeck.actions.registerAction(new VolumeControlDial())
		StreamDeck.actions.registerAction(new PlaybackControlDial())
		StreamDeck.actions.registerAction(new MyPlaylistsDial())
		StreamDeck.actions.registerAction(new NewReleasesDial())
	}
}
