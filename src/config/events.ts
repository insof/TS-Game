/**
 * Game events
 */

export const EVENTS = {
    LOADER: {
        LOAD_END: "loadEnd"
    },
    GAME: {
        SPIN: "spin",
        BALANCE_CHANGE: "balanceChange",
        BALANCE_UPDATE: "balanceUpdate",
        BET_CHANGE: "betChange"
    },
    SLOTS: {
        ROLL_START: "start",
        PREDICTION_RESULT: "predictedResult",
        SPIN_END: "finish",
        START_REEL: "startreel",
        PREROLL_REEL: "prerollreel",
        ROLL_REEL: "rollreel",
        POSTROLL_REEL: "postrollreel",
        FINISH_REEL: "finishreel",
    },
    REEL: {
        START: "start",
        PREROLL: "preroll",
        ROLL: "roll",
        POSTROLL: "postroll",
        FINISH: "finish"
    }
};
