/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { css, LitElement, html } from 'lit-element';

// These are the dw element needed by this element.
import '@dw/dw-input/dw-input.js';
import '@dreamworld/dw-button/dw-button.js';
import '@dw/dw-icon-button/dw-icon-button.js';
import { DwFormElement } from '@dw/dw-form/dw-form-element';

// These are the lodash element needed by this element.
import uniq from 'lodash-es/uniq.js';
import compact from 'lodash-es/compact.js';
import isArray from 'lodash-es/isArray.js';

// These are the dw styles element needed by this element.
import { flexLayout } from '@dreamworld/flex-layout/flex-layout.js';
import { alignment } from '@dreamworld/flex-layout/flex-layout-alignment.js';
import { Typography } from '@dw/material-styles/typography.js';

export class DwMultiValueField extends DwFormElement(LitElement) {
  static get styles() {
    return [
      flexLayout,
      alignment,
      Typography,
      css`
        :host {
          display: inline-block;
        }
        dw-icon-button {
          width: 48px;
          height: 48px;
          margin-left: 16px;
        }
        .container {
          margin-bottom: 16px;
        }
        .error-message {
          color: var(--mdc-theme-error, #b00020);
          margin-bottom: 16px;
        }
      `
    ];
  }

  static get properties() {
    return {
      /**
       * label of element
       */
      label: { type: String },

      /**
       * name of element
       */
      name: { type: String },

      /**
       * consider minimum element is required
       */
      min: { type: Number },

      /**
       * consider maximum element is required
       */
      max: { type: Number },

      /**
       * value of this element
       */
      value: { type: Array },

      /**
       * contains errorMessage
       */
      errorMessage: { type: String },

      /**
       * `true` if allow to enter duplicate value
       */
      allowDuplicates: { type: Boolean },

      /**
       * contains howmany elements is displyed
       */
      _value: { type: Array }
    }
  }

  render() {
    let required = false;
    return html`
      <div class="layout vertical input-container">
        ${this._value && this._value.length ? html`
          ${this._value.map((value, index) => {
            return html`
              <section class="layout horizontal container">
                ${this._formElementTemplate(index, value, required)}
                ${this._value.length > this.min ?
                    html`<dw-icon-button icon="clear" @click="${this.remove}" .index="${index}"></dw-icon-button>`
                  : ''
                }
              </section>
            `
          })}
        ` : ''}
        ${this.errorMessage ? html`<div class="error-message body1">${this.errorMessage}</div>` : ''}
      </div>
      ${this._addButtonTemplate()}
    `
  }

  constructor() {
    super();

    this._value = [];
    this.label = '';
    this.min = 0;
    this._min = 0;
    this.errorMessage = '';
    this.allowDuplicates = false;
    this._elements = [];
    this._valueChanged = this._valueChanged.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('register-dw-form-element', (e) => {
      if (!e || !e.detail) {
        return;
      }

      e.detail.addEventListener('value-changed', this._valueChanged);
      e.detail.addEventListener('unregister-dw-form-element', (e) => {
        if (this._elements.indexOf(e.detail) != -1) {
          this._elements.splice(e.detail.index, 1);
        }
        e.detail.removeEventListener('value-changed', this._valueChanged);
      });

      this._elements.push(e.detail);
    });
  }

  /**
   * 
   * @param {Number} index 
   * @param {String} value 
   * @param {Boolean} required 
   * used to render template.
   */
  _formElementTemplate(itemIndex, itemValue, required) {
    return html`
      <dw-input 
        label="${this.label}"
        .value="${itemValue}" 
        .index="${itemIndex}"
        ?required=${required || (itemIndex < this.min) ? true : false} 
        errorMessage="required">
      </dw-input>
    `
  }

  /**
   * add button template
   */
  _addButtonTemplate() {
    return html` 
      ${this._value.length >= this.max ? '' : html`<dw-button outlined label="Add" @click="${this.addNew}"></dw-button>`}
    `
  }

  /**
   * @param {Array} index 
   * set value
   */
  set value(val) {
    if(!isArray){
      throw new Error('value must be array');
    }

    this._ensureMin();
    this.requestUpdate('value', val);
  }

  /**
   * get value
   */
  get value() {
    return this._isEmpty();
  }

  /**
   * @param {Number} val 
   */
  set min(val) {
    let oldValue = this._min;
    this._min = val;
    this._ensureMin();
    this.requestUpdate('min', oldValue);
  }

  /**
   * get min value
   */
  get min() {
    return this._min;
  }

  /**
   * Ensures that _value.length is >= min. It uses `addNew()` to fill-up the remaining space
   */
  _ensureMin() {
    if (this._value && this._value.length >= this._min) {
      return;
    }

    for (let i = 0; i < this._min; i++) {
      this.addNew();
    }
  }

  /**
   * remove falsy value from array
   */
  _isEmpty() {
    let aValue = [];

    [...this._value].forEach((value) => {
      if (this._getNewVal() != value) {
        aValue.push(value);
      }
    });

    return aValue;
  }

  /**
   * It's validate any one field has validation is false
   * It's also validate field has a duplicate value or not.
   */
  validate() {
    let bValidate = true;

    this._elements.forEach((element) => {
      if (!element.validate()) {
        bValidate = false;
      }
    });

    let bDuplicate = this.hasDuplicates(this._value);

    if (bDuplicate) {
      bValidate = !bDuplicate;
      this._setErrorMessage('Remove duplicate value');
    }

    if (bValidate) {
      this._setErrorMessage('');
    }

    return bValidate;
  }

  /**
   * @param {String} errorMessage
   * sets errorMessage 
   */
  _setErrorMessage(errorMessage) {
    this.errorMessage = errorMessage;
  }

  /**
   * 
   * @param {Array} array 
   * It's return true if array has duplicate value otherwise false
   */
  hasDuplicates(array) {
    if (this.allowDuplicates) {
      return false;
    }

    let aUniq = [...array];

    return uniq(compact(aUniq)).length !== compact(aUniq).length;
  }

  /**
   * 
   * @param {Object} e 
   * sets '_value' property
   */
  _valueChanged(e) {
    let value = e.currentTarget.value;
    let index = e.currentTarget.index;

    if (value === this._value[index]) {
      return;
    }

    this._value.splice(index, 1, value);
  }

  /**
   * 
   * @param {Object} e
   * remove value from specific index 
   */
  remove(e) {
    let index = e.currentTarget.index;

    this._value = [...this._value];
    this._value.splice(index, 1);
  }

  /**
   * call _getNewVal function
   */
  addNew() {
    let aNewValue = [...this._value];
    let newVal = this._getNewVal();
    aNewValue.push(newVal);
    this._value = aNewValue;
  }

  /**
   * set '_value' propret
   */
  _getNewVal() {
    return null;
  }
}

window.customElements.define('dw-multi-value-field', DwMultiValueField);
