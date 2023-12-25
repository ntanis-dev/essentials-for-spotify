import streamDeck from '@elgato/streamdeck'
import logger from './logger'

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

const register = () => {
	streamDeck.actions.registerAction(new PlayPauseButton())
	streamDeck.actions.registerAction(new PreviousSongButton())
	streamDeck.actions.registerAction(new NextSongButton())
	streamDeck.actions.registerAction(new LoopContextButton())
	streamDeck.actions.registerAction(new LoopSongButton())
	streamDeck.actions.registerAction(new ShuffleButton())
	streamDeck.actions.registerAction(new LikeUnlikeButton())
	streamDeck.actions.registerAction(new VolumeUpButton())
	streamDeck.actions.registerAction(new VolumeDownButton())
	streamDeck.actions.registerAction(new VolumeMuteUnmuteButton())
	logger.info('Registered actions.')
}

export default {
	register
}
