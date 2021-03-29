import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MyLocalStorageService {

    private inMemory: Map<string, any> = new Map();
    private localStorageUnavailable = false;


    constructor() {
        this.localStorageUnavailable = !this.isAvailable();
    }

    public store(key: string, value: any): any {
        if (this.localStorageUnavailable) {
            this.inMemory.set(key, value);
            return value;
        } else {
            window.localStorage.setItem(key, value);
        }
    }

    public clear(key: string): void {
        if (this.localStorageUnavailable) {
            this.inMemory.delete(key);
        } else {
            window.localStorage.removeItem(key);
        }
    }

    public retrieve(key: string): any {
        if (this.localStorageUnavailable) {
            return this.inMemory.get(key) || null;
        } else {
            return window.localStorage.getItem(key);
        }
    }

    public isAvailable(): boolean {
        try {
            return window.localStorage !== undefined;
        } catch (e) {
            console.warn('Local storage unavailable, will use in-memory storage');
            return false;
        }
    }
}
