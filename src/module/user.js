export class PTUUser extends User {
    /** @override */
    prepareData() {
        super.prepareData();
        if (canvas.ready && canvas.tokens.controlled.length > 0) {
            game.pe.tokenPanel.refresh();
        }
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.flags = foundry.utils.mergeObject(
            {
                pe: {
                    settings: {
                        showTokenPanel: true
                    }
                }
            },
            this.flags
        )
    }

    get settings() {
        return this.flags.pe.settings;
    }

    clearTargets() {
        this.updateTokenTargets();
    }
}