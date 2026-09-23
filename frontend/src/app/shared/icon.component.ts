import { Component, Input } from '@angular/core';
import icons from './icons.json';
@Component({selector:'app-icon', standalone:true, template:`<svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">@for (part of parts; track $index) { @switch (part[0]) { @case ('path') {<svg:path [attr.d]="part[1]['d']"/>} @case ('circle') {<svg:circle [attr.cx]="part[1]['cx']" [attr.cy]="part[1]['cy']" [attr.r]="part[1]['r']"/>} @case ('rect') {<svg:rect [attr.x]="part[1]['x']" [attr.y]="part[1]['y']" [attr.width]="part[1]['width']" [attr.height]="part[1]['height']" [attr.rx]="part[1]['rx']"/>} @case ('line') {<svg:line [attr.x1]="part[1]['x1']" [attr.y1]="part[1]['y1']" [attr.x2]="part[1]['x2']" [attr.y2]="part[1]['y2']"/>} @case ('polyline') {<svg:polyline [attr.points]="part[1]['points']"/>} @case ('polygon') {<svg:polygon [attr.points]="part[1]['points']"/>} } }</svg>`})
export class IconComponent {
 @Input() name = 'user'; @Input() size = 18;
 get parts(): [string, Record<string,string>][] { return (icons as unknown as Record<string,[string,Record<string,string>][]>)[this.name] || []; }
}
