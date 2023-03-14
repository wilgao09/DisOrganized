package db

import "sort"

func (cfg *DbConfigFile) Init() {
	sort.Slice(cfg.Deps, func(i, j int) bool {
		return i < j
	})
}

func (cfg *DbConfigFile) AddDependency(dep string) bool {
	// insert via bin
	var l, r, mid int
	l = 0
	r = len(dep) - 1
	if dep < cfg.Deps[l] {
		l = 0
		goto ins
	}
	if dep > cfg.Deps[r] {
		l = r + 1
		goto ins
	}

	for l < r {
		mid = (l + r) >> 1
		if cfg.Deps[mid] == dep {
			return false
		} else if cfg.Deps[mid] < dep {
			l = mid + 1
		} else {
			r = mid - 1
		}
	}
	if cfg.Deps[l] == dep {
		return false
	}
ins:
	t := append(cfg.Deps, "")
	copy(t[l+1:], t[l:])
	t[l] = dep
	cfg.Deps = t
	return true
}
