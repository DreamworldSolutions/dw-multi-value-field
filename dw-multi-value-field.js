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
import { repeat } from 'lit-html/directives/repeat';

// These are the dw element needed by this element.
import '@dreamworld/dw-input/dw-input.js';
import '@dreamworld/dw-button/dw-button.js';
import '@dreamworld/dw-icon-button/dw-icon-button.js';
import { DwFormElement } from '@dreamworld/dw-form/dw-form-element';

// These are the lodash element needed by this element.
import uniqWith from 'lodash-es/uniqWith';
import isEqual from 'lodash-es/isEqual';
import isEmpty from 'lodash-es/isEmpty';
import isArray from 'lodash-es/isArray.js';
import forIn from 'lodash-es/forIn.js';

// These are the dw styles element needed by this element.
import { flexLayout } from '@dreamworld/flex-layout/flex-layout.js';
import { alignment } from '@dreamworld/flex-layout/flex-layout-alignment.js';
import { Typography } from '@dreamworld/material-styles/typography.js';

export class DwMultiValueField extends DwFormElement(LitElement) {
  static get styles() {
    return [
      flexLayout,
      alignment,
      Typography,
      css`
        :host {
          display: inline-block;
          --dw-icon-color: rgba(0, 0, 0, 0.6);
        }
        dw-icon-button {
          width: 48px;
          height: 48px;
          margin-left: 16px;
        }
        .input-container,
        .label {
          margin-bottom: 16px;
        }
        .error-message {
          color: var(--mdc-theme-error, #b00020);
          margin-bottom: 16px;
        }
        .main-container .no-record-message {
          min-height: 48px;
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
       * `true` if allow to enter duplicate value. 
       * This property is used during `validate` logic, to check whether any element is duplicate or not.
       */
      allowDuplicates: { type: Boolean },

      /**
       * A Text message which is dispalyed to the user when duplicate value is found in the Array.
       */
      duplicateValidationMsg: { type: String },

      /**
       * A Text message which is dispalyed to the user when `min` validation is falied.
       */
      minValidationMsg: {type: String},

      /**
       * contains howmany elements is displyed
       */
      _value: { type: Array }
    }
  } 

  render() {
    let required = false;
    return html`
      ${this.label ? html `<div class="body1 label">${this.label}</div>` : ''}
      <div class="layout vertical main-container">
        ${repeat(this._getValueAsArray(), (value) => this._formElementId(value), (value, index) => html`
          <section class="layout horizontal input-container">
            ${this._formElementTemplate(index, value, required)}
              ${this._value.length > this.min ?
                html`<dw-icon-button icon="clear" @click="${this._onRemove}" .index="${index}"></dw-icon-button>`
                : ''
              }
          </section>
        `)}
        ${this._value && !this._value.length ? html`${this._noRecordViewTempalte()}` : '' }
      ${this.errorMessage ? html`<div class="error-message body1">${this.errorMessage}</div>` : ''}
      </div>
      ${this._addButtonTemplate()}
    `
  }

  constructor() {
    super();

    this._value = [];
    this.label = '';
    this._min = 0;
    this.errorMessage = '';
    this.allowDuplicates = false;
    this._formElements = [];
    this._onElementValueChange = this._onElementValueChange.bind(this);
    this.duplicateValidationMsg = 'Duplicate value is not allowed';
    this.noRecordMessage = 'No records found';
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('register-dw-form-element', (e) => {
      let el = e.composedPath()[0];

      if(el === this){
        return;
      }
      
      el.addEventListener('value-changed', this._onElementValueChange);
      el.addEventListener('unregister-dw-form-element', (e) => {
        let removeEl = e.composedPath()[0];
        
        if (this._formElements.indexOf(removeEl) != -1) {
          this._formElements.splice(removeEl.index, 1);
        }

        el.removeEventListener('value-changed', this._onElementValueChange);
      });

      this._formElements.push(el);
    });

    this.minValidationMsg = `Minimum ${this.min} fields is required`;
  }

  /**
   * Protected method. 
   * By default it renders `dw-input` as the form-element. You may override this to render any custom-form element.
   * IMPORTANT: You should propertly set `index` property of the `dw-form-element`, as it's being used in other logic.
   * @param {Number} index 
   * @param {String} value 
   * @param {Boolean} required 
   * used to render template.
   */
  _formElementTemplate(itemIndex, itemValue, required) {
    return html`
      <dw-input 
        .value="${itemValue}" 
        .index="${itemIndex}"
        ?required="${required || (itemIndex < this.min) ? true : false}">
      </dw-input>
    `;
  }

  /**
   * @return {Array} 
   */
  _getValueAsArray() {
    if (!this._value) {
      return [];
    }

    if (!isArray(this._value)) {
      console.warn("value isn't an Array");
      return [];
    }

    return this._value;
  }

  /**
   * A protected method, which provides identity of the form-element based on it's value. It's used as the `key` 
   * attribute to render this form-element using `repeat` directive.
   * 
   * This function MUST be overriden when form-element's value is complex data-type (not a primitive). When this 
   * function is properly configured, it avoids re-rendering of all the items when one of the item (e.g. Top  item) is
   * removed from the Array.
   * 
   * Default implementation returns the input value itself. So, it works ok for primitive types.
   * @param {*} value 
   */
  _formElementId(value) {
    return value;
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
    let oldValue = this._value;
    this._value = val;

    if (!isArray(oldValue)) {
      throw new Error('value must be array');
    }

    this.requestUpdate('value', oldValue);
  }

  /**
   * get value
   */
  get value() {
    let aValue = [];

    [...this._value].forEach((value) => {
      if (!this._isEmptyVal(value)) {
        aValue.push(value);
      }
    });

    return aValue;
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
   * It's validate any one field has validation is false
   * It's also validate field has a duplicate value or not.
   */
  validate() {
    let bValidate = true;

    forIn(this._formElements, (element) => {
      if (!element.validate || typeof element.validate !== 'function') {
        return;
      }

      if (!element.validate()) {
        bValidate = false;
      }
    });

    //Retrieve array of values, where empty values have been removed.
    let value = this.value;

    //Min validation
    if(value.length < this.min) {
      this.errorMessage = this.minValidationMsg;
      return false;
    }

    //duplicate validation
    if (!this.allowDuplicates && this._hasDuplicates(value)) {
      this.errorMessage = this.duplicateValidationMsg;
      return false;
    }

    //If validation is passsed then clear any errorMessage if was shown from previous validation,
    this.errorMessage = '';
    return bValidate;
  }

  /**
   * A protected method.
   * Verifies whether 2 arguments are equal or not.
   * 
   * Default implementation checks based on the deep equality of the value. In most cases, you don't need to override
   * this method. Just override `_formElementId` method, and you will be set.
   * @param {*} a 
   * @param {*} b 
   */
  _isEqual(a, b) {
    return isEqual(this._formElementId(a), this._formElementId(b));
  }

  /**
   * Identifies whether value Array has any duplicate element or not.
   * Typically this method receives Array where empty value has already been removed. So, duplicate is checked for the
   * actual user inputted value.
   * 
   * @param value Array of values for which duplicate validation is to be performed.
   */
  _hasDuplicates(value) {
    let newVal = uniqWith(value, this._isEqual.bind(this));
    return newVal.length < value.length;
  }

  /**
   * 
   * @param {Object} e 
   * sets '_value' property
   */
  _onElementValueChange(e) {
    let el = e.currentTarget;
    let formElValue = el.value;
    let formElIndex = el.index;

    if (formElValue === this._value[formElIndex]) {
      console.debug("Value is already same, so skip updating our Array");
      return;
    }

    let newValue = [...this._value];
    newValue.splice(formElIndex, 1, formElValue);
    this.value = newValue;
  }

  /**
   * 
   * @param {Object} e
   * remove value from specific index 
   */
  _onRemove(e) {
    let index = e.currentTarget.index;

    let value = [...this._value];
    value.splice(index, 1);
    this.value = value;
  }

  /**
   * call _getNewVal function
   */
  addNew() {
    this.value = [...this._value,  this._getNewVal()];
  }

  /**
   * A Protected method.
   * 
   * Checks whether the given value is empty or not. By default it checks based on javascript falsy value check.
   * You may need to override this in case your value is not primitive.
   * @param {*} val 
   */
  _isEmptyVal(val) {
    return isEmpty(val);
  }

  /**
   * A protected method.  You may override it as per your need.
   * Returns a value to be used for the newly added form-element.
   * It could return any complex data-type like Object (or even Array), condition is only that the your form-element 
   * (rendered through `_formElementTemplate`) should support that value in the `value` property.
   * 
   * By default it return `null`. 
   */
  _getNewVal() {
    return null;
  }

  /**
   * A protected method.  You may override it as per your need.
   * Returns html template of `No records found` when records is not available.
   * 
   * By default it return `null`. 
   */
  _noRecordViewTempalte(){
    return html`<div class="body1 layout vertical center-center no-record-message">${this.noRecordMessage}</div>`
  }
}

window.customElements.define('dw-multi-value-field', DwMultiValueField);
