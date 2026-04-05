import { Component } from '@angular/core';
import { EmptyLayoutComponent } from './layouts/empty/empty.component';

@Component({
    selector: 'empty-layout-wrapper',
    template: '<empty-layout></empty-layout>',
    standalone: true,
    imports: [EmptyLayoutComponent],
})
export class EmptyLayoutWrapperComponent {}

