package db

import "sort"

func (cfg *DbConfigFile) Init() {
	sort.Slice(cfg.Plugins, func(i, j int) bool {
		return i < j
	})
}

// TODO: remove this; the dependencies dont need to be in any particular order
func (cfg *DbConfigFile) AddDependency(dep string) bool {
	// insert via bin
	var l, r, mid int
	l = 0
	r = len(dep) - 1
	if dep < cfg.Plugins[l] {
		l = 0
		goto ins
	}
	if dep > cfg.Plugins[r] {
		l = r + 1
		goto ins
	}

	for l < r {
		mid = (l + r) >> 1
		if cfg.Plugins[mid] == dep {
			return false
		} else if cfg.Plugins[mid] < dep {
			l = mid + 1
		} else {
			r = mid - 1
		}
	}
	if cfg.Plugins[l] == dep {
		return false
	}
ins:
	t := append(cfg.Plugins, "")
	copy(t[l+1:], t[l:])
	t[l] = dep
	cfg.Plugins = t
	return true
}
