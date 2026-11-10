import { ref, watch, nextTick, toRaw, onScopeDispose } from "vue";

function mergeDeep(defaults, source) {
	// Merge the default options with the stored options
	const output = { ...defaults }; // Start with defaults

	Object.keys(defaults).forEach((key) => {
		const defaultValue = defaults[key];
		const sourceValue = source?.[key];

		if (isObject(defaultValue) && sourceValue != null) {
			// Recursively merge nested objects
			output[key] = mergeDeep(defaultValue, sourceValue);
		} else if (checkType(defaultValue, sourceValue)) {
			output[key] = sourceValue;
		} else {
			// If the type is different, use the default value
			output[key] = defaultValue;
			console.log("Type mismatch", key, sourceValue);
		}
	});

	return output;
}

function checkType(defaultValue, value) {
	// Check if the value type is the same type as the default value or null
	// there are only strings, booleans, nulls and arrays as types left
	return (typeof value === typeof defaultValue && Array.isArray(value) == Array.isArray(defaultValue)) || value === null;
}

function isObject(value) {
	return value !== null && value instanceof Object && !Array.isArray(value);
}

function isEmptyObject(value) {
	return isObject(value) && Object.keys(value).length === 0;
}

export function useBrowserSyncStorage(key, defaultValue) {
	return useBrowserStorage(key, defaultValue, "sync");
}

export function useBrowserLocalStorage(key, defaultValue) {
	return useBrowserStorage(key, defaultValue, "local");
}

function useBrowserStorage(key, defaultValue, storageType = "sync") {
	const data = ref(defaultValue);
	// Blocking setting storage if it is updating from storage
	let isUpdatingFromStorage = true;
	const defaultIsObject = isObject(defaultValue);
	
	// Check if chrome extension API is available (not available in dev mode)
	const isExtensionContext = typeof chrome !== 'undefined' && chrome.storage;
	
	if (!isExtensionContext) {
		// Fallback for dev mode: use localStorage
		const storageKey = `${storageType}_${key}`;
		
		// Initialize from localStorage
		const promise = new Promise((resolve) => {
			try {
				const stored = localStorage.getItem(storageKey);
				if (stored !== null) {
					const parsed = JSON.parse(stored);
					if (defaultIsObject && isObject(parsed)) {
						data.value = isEmptyObject(defaultValue) ? parsed : mergeDeep(defaultValue, parsed);
					} else if (checkType(defaultValue, parsed)) {
						data.value = parsed;
					}
				}
			} catch (e) {
				console.warn(`Failed to load ${key} from localStorage:`, e);
			}
			isUpdatingFromStorage = false;
			resolve(true);
		});
		
		// Watch for changes and update localStorage
		watch(
			data,
			(newValue) => {
				if (!isUpdatingFromStorage) {
					if (checkType(defaultValue, newValue)) {
						try {
							localStorage.setItem(storageKey, JSON.stringify(toRaw(newValue)));
						} catch (e) {
							console.error(`Failed to save ${key} to localStorage:`, e);
						}
					} else {
						console.error("not updating " + key + ": type mismatch");
					}
				}
			},
			{ deep: true, flush: "post" },
		);
		
		return { data, promise };
	}
	
	// Original chrome.storage implementation
	// Initialize storage with the value from chrome.storage
	const promise = new Promise((resolve) => {
		chrome.storage[storageType].get(key, async (result) => {
			if (result?.[key] !== undefined) {
				if (defaultIsObject && isObject(result[key])) {
					data.value = isEmptyObject(defaultValue) ? result[key] : mergeDeep(defaultValue, result[key]);
				} else if (checkType(defaultValue, result[key])) {
					data.value = result[key];
				}
			}
			await nextTick();
			isUpdatingFromStorage = false;
			resolve(true);
		});
	});

	// Watch for changes in the storage and update chrome.storage
	watch(
		data,
		(newValue) => {
			if (!isUpdatingFromStorage) {
				if (checkType(defaultValue, newValue)) {
					chrome.storage[storageType].set({ [key]: toRaw(newValue) });
				} else {
					console.error("not updating " + key + ": type mismatch");
				}
			}
		},
		{ deep: true, flush: "post" },
	);
	// Add the onChanged listener here
	const handleStorageChange = async function (changes, area) {
		if (area !== storageType) return;
		if (changes?.[key]) {
			isUpdatingFromStorage = true;
			const { oldValue, newValue } = changes[key];
			data.value = newValue;
			await nextTick();
			isUpdatingFromStorage = false;
		}
	};
	chrome.storage.onChanged.addListener(handleStorageChange);
	onScopeDispose(() => chrome.storage.onChanged.removeListener(handleStorageChange));
	return { data, promise };
}
