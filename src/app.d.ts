// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** True when this host requires an SND membership session. */
			gate: boolean;
			/** True when MembershipWorks accepted the SFSF cookie. */
			member: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
