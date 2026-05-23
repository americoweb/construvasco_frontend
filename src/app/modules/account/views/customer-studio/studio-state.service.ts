import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { StudioService } from '../../../../shared/construction/studio.service';
import { StudioState } from '../../../../shared/construction/construction.types';

@Injectable()
export class StudioStateService {
  private readonly stateSubject = new BehaviorSubject<StudioState | null>(null);
  private readonly generatingSubject = new BehaviorSubject<boolean>(false);
  private readonly showSupersededSubject = new BehaviorSubject<boolean>(false);

  readonly state$ = this.stateSubject.asObservable();
  readonly isGenerating$ = this.generatingSubject.asObservable();
  readonly showSuperseded$ = this.showSupersededSubject.asObservable();

  constructor(private studioApi: StudioService) {}

  get snapshot(): StudioState | null {
    return this.stateSubject.value;
  }

  get isGenerating(): boolean {
    return this.generatingSubject.value;
  }

  load(): Observable<{ data: StudioState }> {
    return this.studioApi.getState().pipe(
      tap((res) => this.stateSubject.next(res.data))
    );
  }

  applyState(state: StudioState): void {
    this.stateSubject.next(state);
  }

  patchLocal(partial: Partial<StudioState>): void {
    const current = this.stateSubject.value;
    if (!current) {
      return;
    }
    this.stateSubject.next({ ...current, ...partial });
  }

  setGenerating(value: boolean): void {
    this.generatingSubject.next(value);
  }

  setShowSuperseded(value: boolean): void {
    this.showSupersededSubject.next(value);
  }

  reset(): Observable<{ data: StudioState }> {
    return this.studioApi.resetDraft().pipe(
      tap((res) => {
        this.stateSubject.next(res.data);
        this.generatingSubject.next(false);
        this.showSupersededSubject.next(false);
      })
    );
  }
}
