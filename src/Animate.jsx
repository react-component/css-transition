import React from 'react';
import PropTypes from 'prop-types';
import { polyfill } from 'react-lifecycles-compat';
import toArray from 'rc-util/lib/Children/toArray';

import AnimateChild from './AnimateChild';
import { cloneProps, mergeChildren } from './util';

const defaultKey = `rc_animate_${Date.now()}`;
const clonePropList = ['children'];

class Animate extends React.Component {
  // [Legacy] Not sure usage
  // commit: https://github.com/react-component/animate/commit/0a1cbfd647407498b10a8c6602a2dea80b42e324
  static isAnimate = true; // eslint-disable-line

  static propTypes = {
    component: PropTypes.any,
    componentProps: PropTypes.object,
    animation: PropTypes.object,
    transitionName: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    transitionEnter: PropTypes.bool,
    transitionAppear: PropTypes.bool,
    exclusive: PropTypes.bool,
    transitionLeave: PropTypes.bool,
    onEnd: PropTypes.func,
    onEnter: PropTypes.func,
    onLeave: PropTypes.func,
    onAppear: PropTypes.func,
    showProp: PropTypes.string,
    children: PropTypes.node,
    style: PropTypes.object,
    className: PropTypes.string,
  }

  static defaultProps = {
    animation: {},
    component: 'span',
    componentProps: {},
    transitionEnter: true,
    transitionLeave: true,
    transitionAppear: false,
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { prevProps = {} } = prevState;
    const newState = {
      prevProps: cloneProps(nextProps, clonePropList),
    };

    function processState(propName, updater) {
      if (prevProps[propName] !== nextProps[propName]) {
        updater(nextProps[propName]);
        return true;
      }
      return false;
    }

    processState('children', (children) => {
      const prevChildren = prevState.mergedChildren;
      const currentChildren = toArray(children).filter(node => node);

      // Merge prev children to keep the animation
      newState.mergedChildren = mergeChildren(prevChildren, currentChildren);
      const toKey = ({ key }) => key;
      console.log('children update - prev:', prevChildren.map(toKey));
      console.log('children update - current:', currentChildren.map(toKey));
      console.log('children update - merge:', newState.mergedChildren.map(toKey));
      console.log('-----------------------');
    });

    return newState;
  }

  state = {
    appeared: true,
    mergedChildren: [],
  };

  componentDidMount() {
    // No need to re-render
    this.state.appeared = false;
  }

  onChildLeaved = (key) => {
    // Remove child which not exist anymore
    if (!this.hasChild(key)) {
      const { mergedChildren } = this.state;
      this.setState({
        mergedChildren: mergedChildren.filter(node => node.key !== key),
      });
    }
  };

  onAnimationAction = (func, $ele, childCallback) => {
    if (func) {
      const animation = func($ele, childCallback);
      return animation || {};
    }
    return null;
  };

  onChildAppear = (key, $ele, childCallback) => {
    const { appear } = this.props.animation;
    return this.onAnimationAction(appear, $ele, childCallback);
  };
  onChildEnter = (key, $ele, childCallback) => {
    const { enter } = this.props.animation;
    return this.onAnimationAction(enter, $ele, childCallback);
  };
  onChildLeave = (key, $ele, childCallback) => {
    const { leave } = this.props.animation;
    return this.onAnimationAction(leave, $ele, childCallback);
  };

  hasChild = (key) => {
    const { children } = this.props;

    return toArray(children).some(node => node.key === key);
  };

  render() {
    const { appeared, mergedChildren } = this.state;
    const {
      component: Component, componentProps,
      className, style, showProp,
    } = this.props;


    const $children = mergedChildren.map((node) => {
      if (mergedChildren.length > 1 && !node.key) {
        throw new Error('must set key for <rc-animate> children');
      }

      let show = true;
      if (showProp) {
        show = node.props[showProp];
      } else if (!this.hasChild(node.key)) {
        show = false;
      }

      const key = node.key || defaultKey;

      return (
        <AnimateChild
          {...this.props}
          appeared={appeared}
          show={show}
          className={node.props.className}
          style={node.props.style}
          key={key}

          animateKey={key}
          onChildLeaved={this.onChildLeaved}

          onChildAppear={this.onChildAppear}
          onChildEnter={this.onChildEnter}
          onChildLeave={this.onChildLeave}
        >
          {node}
        </AnimateChild>
      );
    });

    // Wrap with component
    if (Component) {
      let passedProps = this.props;
      if (typeof Component === 'string') {
        passedProps = {
          className,
          style,
          ...componentProps,
        };
      }

      return (
        <Component {...passedProps}>
          {$children}
        </Component>
      );
    }

    return $children[0] || null;
  }
}

polyfill(Animate);

export default Animate;