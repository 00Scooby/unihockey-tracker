export const updateStatLogic = (prevState, playerId, period, statKey, value) => {
    return {
        ...prevState,
        [playerId]: {
            ...prevState[playerId],
            [period]: {
                ...prevState[playerId][period],
                [statKey]: Math.max(0, prevState[playerId][period][statKey] + value)
            }
        }
    };
};
