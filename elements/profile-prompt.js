import { __decorate } from "tslib";
import { css, html, property } from 'lit-element';
import { Button } from 'scoped-material-components/mwc-button';
import { CircularProgress } from 'scoped-material-components/mwc-circular-progress';
import { TextField } from 'scoped-material-components/mwc-textfield';
import { sharedStyles } from './utils/shared-styles';
import { CreateProfileForm } from './create-profile-form';
import { BaseElement, connectDeps, } from '@holochain-open-dev/common';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
/**
 * @element profile-prompt
 */
export class ProfilePrompt extends MobxReactionUpdate(BaseElement) {
    constructor() {
        /** Public attributes */
        super(...arguments);
        /** Private properties */
        this._loading = true;
    }
    static get styles() {
        return [
            sharedStyles,
            css `
        :host {
          display: flex;
        }
      `,
        ];
    }
    async firstUpdated() {
        await this._deps.fetchMyProfile();
        this._loading = false;
    }
    renderPrompt() {
        return html ` <div
      class="column"
      style="align-items: center; justify-content: center; flex: 1;"
    >
      ${this._loading
            ? html `<mwc-circular-progress indeterminate></mwc-circular-progress>`
            : html `<create-profile-form></create-profile-form>`}
    </div>`;
    }
    render() {
        return html `
      ${!this._loading && this._deps.myProfile
            ? html `<slot></slot>`
            : this.renderPrompt()}
    `;
    }
    getScopedElements() {
        return {
            'mwc-textfield': TextField,
            'mwc-button': Button,
            'mwc-circular-progress': CircularProgress,
            'create-profile-form': connectDeps(CreateProfileForm, this._deps),
        };
    }
}
__decorate([
    property({ type: Boolean })
], ProfilePrompt.prototype, "_loading", void 0);
//# sourceMappingURL=profile-prompt.js.map